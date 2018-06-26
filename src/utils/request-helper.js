function getHostInfo(req) {
  const proto = req.secure ? 'https' : 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const origin = `${proto}://${host}`;
  return { proto, host, origin };
}

module.exports = {
  getHostInfo
};
