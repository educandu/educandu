import urls from '../utils/routes.js';
import createError from 'http-errors';
import Logger from '../common/logger.js';
import requestUtils from '../utils/request-utils.js';
import { ERROR_CODES } from '../domain/constants.js';
import ServerConfig from '../bootstrap/server-config.js';
import ErrorPageRenderer from './error-page-renderer.js';

const logger = new Logger(import.meta.url);

class ErrorController {
  static get inject() { return [ServerConfig, ErrorPageRenderer]; }

  constructor(serverConfig, errorPageRenderer) {
    this.errorPageRenderer = errorPageRenderer;
    this.serverConfig = serverConfig;
  }

  registerErrorHandler(router) {
    router.use((req, res, next) => next(createError(404)));

    /* eslint-disable-next-line no-unused-vars */
    router.use((err, req, res, next) => {
      const isApiCall = this.acceptsJson(req);
      const consolidatedErr = this.consolidateError(err, req);

      if (isApiCall && this.tryRespondToExpiredSession(req, res, consolidatedErr)) {
        return;
      }

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

  transformToErrorObject(err) {
    const isValidationError = err.error?.isJoi;
    if (isValidationError) {
      const message = `${err.error.name}: ${err.error.message}`;
      const props = { ...err, details: err.error.details };
      delete props.error;
      return createError(400, message, props);
    }

    return createError(500, err);
  }

  consolidateError(err, req) {
    const consolidatedErr = err.status ? err : this.transformToErrorObject(err);
    consolidatedErr.expose = this.serverConfig.exposeErrorDetails;
    consolidatedErr.request = requestUtils.expressReqToRequest(req);
    return consolidatedErr;
  }

  acceptsJson(req) {
    return req.accepts(['html', 'json']) === 'json';
  }

  tryRespondToExpiredSession(req, res, err) {
    if (!req.isAuthenticated() && req.cookies[this.serverConfig.sessionCookieName]) {
      err.code = ERROR_CODES.sessionExpired;
      res.status(401).json(err);
      return true;
    }

    return false;
  }

  tryRedirectToLogin(req, res, err) {
    if (err.status === 401 && !req.isAuthenticated()) {
      const url = urls.getLoginUrl(req.originalUrl);
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
    let keysToExpose = ['name', 'status', 'message', 'code'];
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

export default ErrorController;
