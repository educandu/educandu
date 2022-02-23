import { getCookie } from './cookie.js';
import { isBrowser } from '../ui/browser-helper.js';
import { LOG_LEVEL_COOKIE_NAME } from '../domain/constants.js';

const getServerLevel = () => process.env.EDUCANDU_LOG_LEVEL || 'debug';
const getBrowserLevel = () => getCookie(LOG_LEVEL_COOKIE_NAME) || 'debug';

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
    serverLevelColor: '[31m',
    serverMessageColor: '[0m',
    browserLevelStyle: 'color: #f5222d; font-weight: bold',
    browserMessageStyle: 'color: inherit'
  },
  error: {
    rank: 2,
    serverLevelColor: '[31m',
    serverMessageColor: '[0m',
    browserLevelStyle: 'color: #f5222d',
    browserMessageStyle: 'color: inherit'
  },
  warn: {
    rank: 3,
    serverLevelColor: '[31m',
    serverMessageColor: '[0m',
    browserLevelStyle: 'color: #d46b08',
    browserMessageStyle: 'color: inherit'
  },
  info: {
    rank: 4,
    serverLevelColor: '[34m',
    serverMessageColor: '[0m',
    browserLevelStyle: 'color: #096dd9',
    browserMessageStyle: 'color: inherit'
  },
  debug: {
    rank: 5,
    serverLevelColor: '[37m',
    serverMessageColor: '[0m',
    browserLevelStyle: 'color: #40a9ff',
    browserMessageStyle: 'color: inherit'
  }
};

const logLevel = isBrowser() ? getBrowserLevel() : getServerLevel();
const logLevelRank = logLevels[logLevel]?.rank || logLevels.error.rank;

const logInBrowserConsole = (level, timestamp, path, args) => {
  const { browserLevelStyle, browserMessageStyle } = logLevels[level];
  // eslint-disable-next-line no-console
  console.log(`%c${level}%c [${timestamp}] [${path}]`, browserLevelStyle, browserMessageStyle, ...args);
};

const logInServerConsole = (level, timestamp, path, args) => {
  const { serverLevelColor, serverMessageColor } = logLevels[level];
  // eslint-disable-next-line no-console
  console.log(`\u001b${serverLevelColor}${level}\u001b${serverMessageColor} [${timestamp}] [${path}]`, ...args);
};

class Logger {
  constructor(name) {
    this.callerPath = isBrowser() ? shortenBrowserUrl(name) : shortenNodeUrl(name);
    this.logFunction = isBrowser() ? logInBrowserConsole : logInServerConsole;
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

    const timestamp = new Date().toISOString();
    this.logFunction(messageLogLevel, timestamp, this.callerPath, args);
  }

}

export default Logger;
