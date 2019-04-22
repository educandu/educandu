/* eslint no-process-env: off */

const path = require('path');
const acho = require('acho');
const cookie = require('./cookie');
const browserHelper = require('../ui/browser-helper');

const getServerLevel = () => process.env.ELMU_LOG_LEVEL || 'debug';
const getBrowserLevel = () => cookie.get('ELMU_LOG_LEVEL') || 'debug';
const formatError = err => err.stack || err.message || err.toString();
const explodeError = obj => obj instanceof Error ? formatError(obj) : obj;
const makeFilenameRelative = filename => path.relative(process.cwd(), filename);

class Logger {
  constructor(name) {
    const isBrowser = browserHelper.isBrowser();
    const level = isBrowser ? getBrowserLevel() : getServerLevel();
    const realName = isBrowser ? name : makeFilenameRelative(name);
    this._acho = acho({
      level: level,
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

module.exports = Logger;
