const { Unauthorized } = require('http-errors');

function requestHandler(req, res, next) {
  return req.isAuthenticated() ? next() : next(new Unauthorized());
}

module.exports = function needsAuthentication() {
  return requestHandler;
};
