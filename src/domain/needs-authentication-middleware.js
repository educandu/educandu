const { UserNotAuthenticatedError } = require('./errors');

function requestHandler(req, res, next) {
  return req.isAuthenticated() ? next() : next(new UserNotAuthenticatedError());
}

module.exports = function needsAuthentication() {
  return requestHandler;
};
