import { Unauthorized } from 'http-errors';

function requestHandler(req, res, next) {
  return req.isAuthenticated() ? next() : next(new Unauthorized());
}

function needsAuthentication() {
  return requestHandler;
}

export default needsAuthentication;
