function getHostInfo(req) {
  const proto = req.protocol;
  const host = req.headers.host;
  const origin = `${proto}://${host}`;
  return { proto, host, origin };
}

function expressReqToRequest(req) {
  return {
    ip: req.ip,
    path: req.path,
    protocol: req.protocol,
    originalUrl: req.originalUrl,
    query: JSON.parse(JSON.stringify(req.query))
  };
}

module.exports = {
  getHostInfo,
  expressReqToRequest
};
