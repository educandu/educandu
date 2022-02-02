import cloneDeep from './clone-deep.js';

export function getHostInfo(req) {
  const proto = req.protocol;
  const host = req.headers.host;
  const origin = `${proto}://${host}`;
  const domain = host.split(':')[0];
  return { proto, host, origin, domain };
}

export function expressReqToRequest(req) {
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

export default {
  getHostInfo,
  expressReqToRequest
};
