/* eslint no-process-env: off */

import acho from 'acho';
import cookie from './cookie';
import formatErrorM from 'format-error';
import { isBrowser } from '../ui/browser-helper';

const getServerLevel = () => process.env.ELMU_LOG_LEVEL || 'debug';
const getBrowserLevel = () => cookie.get('ELMU_LOG_LEVEL') || 'debug';
const formatError = err => formatErrorM.format(err) || err.stack || err.message || err.toString();
const explodeError = obj => obj instanceof Error ? formatError(obj) : obj;
const makeFilenameRelative = filename => {
  const index = filename.indexOf('/elmu-web/');
  return index === -1 ? filename : filename.slice(index + '/elmu-web/'.length);
};

const logLevel = isBrowser() ? getBrowserLevel() : getServerLevel();

class Logger {
  constructor(name) {
    const realName = isBrowser() ? name : makeFilenameRelative(name);
    this._acho = acho({
      level: logLevel,
      outputMessage: message => `[${new Date().toISOString()}] [${realName}] ${message}`
    });
  }

  fatal(...args) {
    this._acho.fatal(...args.map(explodeError));
    return this;
  }

  error(...args) {
    this._acho.error(...args.map(explodeError));
    return this;
  }

  warn(...args) {
    this._acho.warn(...args.map(explodeError));
    return this;
  }

  info(...args) {
    this._acho.info(...args.map(explodeError));
    return this;
  }

  debug(...args) {
    this._acho.debug(...args.map(explodeError));
    return this;
  }

}

export default Logger;
