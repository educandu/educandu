/* eslint no-process-env: off */

import cookie from './cookie.js';
import { isBrowser } from '../ui/browser-helper.js';

const getServerLevel = () => process.env.EDUCANDU_LOG_LEVEL || 'debug';
const getBrowserLevel = () => cookie.get('EDUCANDU_LOG_LEVEL') || 'debug';

const shortenNodeUrl = url => {
  const index = url.indexOf('/src/');
  return index === -1 ? url : url.slice(index);
};

const shortenBrowserUrl = url => {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
};

const logLevels = {
  fatal: {
    rank: 1,
    applyBrowserColor: text => `\u001b[31m${text}\u001b[0m`,
    applyServerColor: text => `\u001b[31m${text}\u001b[0m`
  },
  error: {
    rank: 2,
    applyBrowserColor: text => `\u001b[31m${text}\u001b[0m`,
    applyServerColor: text => `\u001b[31m${text}\u001b[0m`
  },
  warn: {
    rank: 3,
    applyBrowserColor: text => `\u001b[31m${text}\u001b[0m`,
    applyServerColor: text => `\u001b[33m${text}\u001b[0m`
  },
  info: {
    rank: 4,
    applyBrowserColor: text => `\u001b[34m${text}\u001b[0m`,
    applyServerColor: text => `\u001b[34m${text}\u001b[0m`
  },
  debug: {
    rank: 5,
    applyBrowserColor: text => `\u001b[30m${text}\u001b[0m`,
    applyServerColor: text => `\u001b[37m${text}\u001b[0m`
  }
};

const logLevel = isBrowser() ? getBrowserLevel() : getServerLevel();
const logLevelRank = logLevels[logLevel].rank;

class Logger {
  constructor(name) {
    this.callerPath = isBrowser() ? shortenBrowserUrl(name) : shortenNodeUrl(name);
  }

  fatal(...args) {
    this._logMessage('fatal', args);
    return this;
  }

  error(...args) {
    this._logMessage('error', args);
    return this;
  }

  warn(...args) {
    this._logMessage('warn', args);
    return this;
  }

  info(...args) {
    this._logMessage('info', args);
    return this;
  }

  debug(...args) {
    this._logMessage('debug', args);
    return this;
  }

  _logMessage(messageLogLevel, args) {
    if (logLevels[messageLogLevel].rank > logLevelRank) {
      return;
    }

    const coloredLogLevel = isBrowser()
      ? logLevels[messageLogLevel].applyBrowserColor(messageLogLevel)
      : logLevels[messageLogLevel].applyServerColor(messageLogLevel);

    const timestamp = new Date().toISOString();

    // eslint-disable-next-line no-console
    console.log(`${coloredLogLevel}`, `[${timestamp}] [${this.callerPath}]`, ...args);
  }

}

export default Logger;
