import Graceful from 'node-graceful';
import Logger from './common/logger.js';
import { ROLE } from './domain/constants.js';
import UserService from './services/user-service.js';
import ServerConfig from './bootstrap/server-config.js';
import EducanduServer from './server/educandu-server.js';
import JobScheduler from './services/scheduling/job-scheduler.js';
import MaintenanceService from './services/maintenance-service.js';
import { createContainer, disposeContainer } from './bootstrap/server-bootstrapper.js';

const logger = new Logger(import.meta.url);

Graceful.captureExceptions = true;
Graceful.captureRejections = true;
Graceful.timeout = 10000;

export default async function educandu(options) {
  let container = null;

  Graceful.on('exit', async (signal, detail) => {
    logger.info(`Received ${signal} - Starting graceful exit process`);

    if (detail) {
      logger.warn(detail);
    }

    let hasError = false;
    if (container) {
      try {
        logger.info('Start disposing of container');
        await disposeContainer(container);
        logger.info('Container was sucessfully disposed');
      } catch (err) {
        logger.fatal(err);
        hasError = true;
      }
    }

    logger.info(`Graceful exit process has finished ${hasError ? 'with' : 'without'} errors`);

    process.exit(hasError ? 1 : 0);
  });

  try {
    container = await createContainer(options);
    const maintenanceService = container.get(MaintenanceService);
    const educanduServer = container.get(EducanduServer);
    const serverConfig = container.get(ServerConfig);
    const userService = container.get(UserService);

    logger.info('Starting application');

    const runMaintenance = !serverConfig.skipMaintenance;

    logger.info(`Starting server${runMaintenance ? ' in maintenance mode' : ''}`);
    const port = await educanduServer.listen({ maintenance: runMaintenance });

    if (runMaintenance) {
      logger.info('Running maintenance');
      await maintenanceService.runMaintenance();
    } else {
      logger.info('Skipping maintenance');
    }

    if (serverConfig.initialUser) {
      const existingUser = await userService.getActiveUserByEmail(serverConfig.initialUser.email);
      if (existingUser) {
        logger.info('User with initial user email address already exists, skipping creation');
      } else {
        logger.info('Creating initial user');
        await userService.createUser({ ...serverConfig.initialUser, role: ROLE.admin, verified: true });
        logger.info('Initial user sucessfully created');
      }
    }

    if (!serverConfig.disableScheduling) {
      logger.info('Starting job scheduler');
      const jobScheduler = container.get(JobScheduler);
      jobScheduler.start();
    }

    if (runMaintenance) {
      logger.info('Exiting maintenance mode');
      educanduServer.exitMaintenanceMode();
    }

    logger.info('Application started successfully');
    logger.info(`Server listening on http://localhost:${port}`);
  } catch (err) {
    logger.fatal(err);
    Graceful.exit(1);
  }
}
