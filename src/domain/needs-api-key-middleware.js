import httpErrors from 'http-errors';

const { Forbidden } = httpErrors;

function checkApiKey(expectedApiKey, req, _res, next) {
  return req.get('x-api-key') !== expectedApiKey ? next(new Forbidden()) : next();
}

function needsApiKey(expectedApiKey) {
  return checkApiKey.bind(null, expectedApiKey);
}

export default needsApiKey;
