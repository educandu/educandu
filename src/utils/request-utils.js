import cloneDeep from './clone-deep.js';
import fastSafeStringify from 'fast-safe-stringify';

const requestPropsToSerialize = [
  'aborted',
  'httpVersion',
  'complete',
  'headers',
  'trailers',
  'statusCode',
  'statusMessage',
  'method',
  'url',
  'query',
  'originalUrl',
  'protocol',
  'secure',
  'ip',
  'ips',
  'subdomains',
  'path',
  'hostname',
  'fresh',
  'stale',
  'xhr',
  'body',
  'cookies',
  'params',
  'query',
  'route',
  'signedCookies',
  'originalUrl',
  'baseUrl'
];

function getHostInfo(req) {
  const proto = req.protocol;
  const host = req.headers.host;
  const origin = `${proto}://${host}`;
  const domain = host.split(':')[0];
  return { proto, host, origin, domain };
}

function expressReqToRequest(req) {
  return {
    ip: req.ip,
    path: req.path,
    protocol: req.protocol,
    originalUrl: req.originalUrl,
    query: cloneDeep(req.query),
    hostInfo: getHostInfo(req),
    timestamp: new Date().toISOString()
  };
}

function requestToPlainObject(req) {
  const result = {};

  for (const propName of requestPropsToSerialize) {
    const value = req[propName];
    if (typeof value !== 'undefined') {
      result[propName] = typeof value === 'object' && value !== null
        ? JSON.parse(fastSafeStringify(value))
        : value;
    }
  }

  if (result.cookies) {
    delete result.cookies.request;
    delete result.cookies.response;
  }

  return result;
}

export default {
  getHostInfo,
  expressReqToRequest,
  requestToPlainObject
};
