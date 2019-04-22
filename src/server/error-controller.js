const Logger = require('../common/logger');

const logger = new Logger(__filename);

class ErrorController {
  registerErrorHandler(app) {
    app.use((err, req, res, next) => {
      logger.fatal(err);
      next(err);
    });
  }
}

module.exports = ErrorController;
