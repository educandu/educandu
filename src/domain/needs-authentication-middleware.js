import httpErrors from 'http-errors';

const { Unauthorized } = httpErrors;

function requestHandler(req, res, next) {
  return req.isAuthenticated() ? next() : next(new Unauthorized());
}

function needsAuthentication() {
  return requestHandler;
}

export default needsAuthentication;
