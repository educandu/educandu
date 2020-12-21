require('@babel/register')({ extensions: ['.jsx'] });
require('core-js');

const Graceful = require('node-graceful');
const Logger = require('./common/logger');
const ElmuServer = require('./server/elmu-server');
const bootstrapper = require('./bootstrap/server-bootstrapper');

const logger = new Logger(__filename);

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
