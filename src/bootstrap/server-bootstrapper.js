import Cdn from '../repositories/cdn.js';
import Logger from '../common/logger.js';
import { ROLE } from '../domain/role.js';
import Database from '../stores/database.js';
import ServerConfig from './server-config.js';
import ClientConfig from './client-config.js';
import ElmuServer from '../server/elmu-server.js';
import resources from '../resources/resources.json';
import UserService from '../services/user-service.js';
import commonBootstrapper from './common-bootstrapper.js';
import ResourceManager from '../resources/resource-manager.js';

const logger = new Logger(import.meta.url);

export async function createContainer(configValues = {}) {
  logger.info('Creating container');
  const container = await commonBootstrapper.createContainer();

  const serverConfig = new ServerConfig(configValues);
  container.registerInstance(ServerConfig, serverConfig);

  const clientConfig = new ClientConfig(serverConfig.exportClientConfigValues());
  container.registerInstance(ClientConfig, clientConfig);

  logger.info('Establishing database connection');
  const database = await Database.create({
    connectionString: serverConfig.mongoConnectionString
  });

  if (serverConfig.skipDbMigrations) {
    logger.info('Skipping database migrations');
  } else {
    try {
      logger.info('Starting database migrations');
      await database.runMigrationScripts();
      logger.info('Finished database migrations successfully');
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }

  if (serverConfig.skipDbChecks) {
    logger.info('Skipping database checks');
  } else {
    logger.info('Starting database checks');
    await database.checkDb();
    logger.info('Finished database checks successfully');
  }

  logger.info('Registering database');
  container.registerInstance(Database, database);

  logger.info('Creating Cdn');
  const cdn = await Cdn.create({
    endpoint: serverConfig.cdnEndpoint,
    region: serverConfig.cdnRegion,
    accessKey: serverConfig.cdnAccessKey,
    secretKey: serverConfig.cdnSecretKey,
    bucketName: serverConfig.cdnBucketName,
    rootUrl: serverConfig.cdnRootUrl
  });

  logger.info('Registering CDN');
  container.registerInstance(Cdn, cdn);

  const resourceManager = new ResourceManager(resources);

  logger.info('Registering resource manager');
  container.registerInstance(ResourceManager, resourceManager);

  if (serverConfig.initialUser) {
    const userService = container.get(UserService);
    const existingUser = await userService.getUserByEmailAddress(serverConfig.initialUser.email);
    if (existingUser) {
      logger.info('User with initial user email address already exists, skipping creation');
    } else {
      logger.info('Creating initial user');
      await userService.createUser({ ...serverConfig.initialUser, roles: [ROLE.user, ROLE.admin], verified: true });
      logger.info('Initial user sucessfully created');
    }
  }

  return container;
}

export function disposeContainer(container) {
  logger.info('Disposing container');
  return Promise.all([
    container.get(ElmuServer),
    container.get(Database),
    container.get(Cdn)
  ].map(service => service.dispose()));
}

export default {
  createContainer,
  disposeContainer
};
