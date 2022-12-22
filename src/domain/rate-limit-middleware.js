import httpErrors from 'http-errors';

const { TooManyRequests } = httpErrors;

function createRateLimitMiddleware({ maxRequests, expiresInMs, store }) {
  return async function rateLimitMiddleware(req, _res, next) {
    try {
      const newCount = await store.incrementCount({ req, expiresInMs });
      return newCount > maxRequests ? next(new TooManyRequests()) : next();
    } catch (error) {
      return next(error);
    }
  };
}

export default createRateLimitMiddleware;
