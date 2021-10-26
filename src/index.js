import Graceful from 'node-graceful';
import Logger from './common/logger.js';
import ElmuServer from './server/elmu-server.js';
import bootstrapper from './bootstrap/server-bootstrapper.js';

const logger = new Logger(import.meta.url);

Graceful.exitOnDouble = true;
Graceful.timeout = 10000;

(async function index() {

  let container = null;

  Graceful.on('exit', async (event, signal) => {
    logger.info(`Received ${signal} - Starting graceful exit process`);

    let hasError = false;
    if (container) {
      try {
        logger.info('Start disposing of container');
        await bootstrapper.disposeContainer(container);
        logger.info('Container was sucessfully disposed');
      } catch (err) {
        logger.fatal(err);
        hasError = true;
      }
    }

    logger.info(`Graceful exit process has finished ${hasError ? 'with' : 'without'} errors`);

    // eslint-disable-next-line no-process-exit
    process.exit(hasError ? 1 : 0);
  });

  process.on('uncaughtException', err => {
    logger.fatal(err);
    Graceful.exit(1);
  });

  try {

    logger.info('Starting application');

    container = await bootstrapper.createContainer();
    const elmuServer = container.get(ElmuServer);

    logger.info('Starting server');
    elmuServer.listen((err, port) => {
      if (err) {
        logger.fatal(err);
        Graceful.exit(1);
      } else {
        logger.info(`App listening on http://localhost:${port}`);
      }
    });

  } catch (err) {

    logger.fatal(err);
    Graceful.exit(1);

  }

})();
