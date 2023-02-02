import httpErrors from 'http-errors';

const { TooManyRequests } = httpErrors;

function createRateLimitMiddleware({ maxRequests, expiresInMs, service }) {
  return async function rateLimitMiddleware(req, _res, next) {
    try {
      const newCount = await service.incrementCount({ req, expiresInMs, maxRequests });
      return newCount === maxRequests ? next(new TooManyRequests()) : next();
    } catch (error) {
      return next(error);
    }
  };
}

export default createRateLimitMiddleware;
