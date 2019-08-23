const urls = require('../utils/urls');
const Logger = require('../common/logger');
const createError = require('http-errors');
const requestHelper = require('../utils/request-helper');
const ErrorPageRenderer = require('./error-page-renderer');
const ServerSettings = require('../bootstrap/server-settings');

const logger = new Logger(__filename);

class ErrorController {
  static get inject() { return [ServerSettings, ErrorPageRenderer]; }

  constructor(serverSettings, errorPageRenderer) {
    this.errorPageRenderer = errorPageRenderer;
    this.serverSettings = serverSettings;
  }

  registerErrorHandler(router) {
    router.use((req, res, next) => next(createError(404)));

    /* eslint-disable-next-line no-unused-vars */
    router.use((err, req, res, next) => {
      const isApiCall = this.acceptsJson(req);
      const consolidatedErr = this.consolidateError(err, req);

      if (!isApiCall && this.tryRedirectToLogin(req, res, consolidatedErr)) {
        return;
      }

      this.log(consolidatedErr);

      if (isApiCall) {
        this.sendErrorJson(res, consolidatedErr);
      } else if (!this.tryRedirectToLogin(req, res, consolidatedErr)) {
        this.sendErrorHtml(req, res, consolidatedErr);
      }
    });
  }

  log(err) {
    logger.fatal(err);
  }

  consolidateError(err, req) {
    const consolidatedErr = err.status ? err : createError(500, err);
    consolidatedErr.expose = this.serverSettings.exposeErrorDetails;
    consolidatedErr.request = requestHelper.expressReqToRequest(req);
    return consolidatedErr;
  }

  acceptsJson(req) {
    return req.accepts(['html', 'json']) === 'json';
  }

  tryRedirectToLogin(req, res, err) {
    if (err.status === 401 && !req.isAuthenticated()) {
      const url = urls.getLoginUrl(req.path);
      res.redirect(url);
      return true;
    }

    return false;
  }

  sendErrorJson(res, err) {
    res.status(err.status).type('json').send(this.errorToPlainObj(err));
  }

  sendErrorHtml(req, res, err) {
    this.errorPageRenderer.sendPage(req, res, err);
  }

  errorToPlainObj(err) {
    let keysToExpose = ['name', 'status', 'message'];
    if (err.expose) {
      keysToExpose = [...keysToExpose, 'stack', ...Object.keys(err)];
    }

    return keysToExpose
      .filter(key => !['expose', 'statusCode'].includes(key) && (key in err) && (typeof err[key] !== 'function'))
      .reduce((obj, key) => {
        obj[key] = err[key];
        return obj;
      }, {});
  }
}

module.exports = ErrorController;
