import createError from 'http-errors';
import routes from '../utils/routes.js';
import Logger from '../common/logger.js';
import requestUtils from '../utils/request-utils.js';
import ServerConfig from '../bootstrap/server-config.js';
import ErrorPageRenderer from './error-page-renderer.js';
import { ERROR_CODES, HTTP_STATUS } from '../domain/constants.js';

const logger = new Logger(import.meta.url);

class ErrorController {
  static get inject() { return [ServerConfig, ErrorPageRenderer]; }

  constructor(serverConfig, errorPageRenderer) {
    this.errorPageRenderer = errorPageRenderer;
    this.serverConfig = serverConfig;
  }

  registerErrorHandler(router) {
    router.use((_req, _res, next) => next(createError(HTTP_STATUS.notFound)));

    // eslint-disable-next-line no-unused-vars
    router.use((err, req, res, _next) => {
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
      } else {
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
      return createError(HTTP_STATUS.badRequest, message, props);
    }

    return createError(HTTP_STATUS.internalServerError, err);
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
    if (err.status === HTTP_STATUS.unauthorized && !req.isAuthenticated() && req.cookies[this.serverConfig.sessionCookieName]) {
      err.code = ERROR_CODES.sessionExpired;
      res.status(HTTP_STATUS.unauthorized).json(err);
      return true;
    }

    return false;
  }

  tryRedirectToLogin(req, res, err) {
    if (err.status === HTTP_STATUS.unauthorized && !req.isAuthenticated()) {
      const url = routes.getLoginUrl(req.originalUrl);
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
