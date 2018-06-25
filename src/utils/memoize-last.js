const QuickLRU = require('quick-lru');
const mem = require('mem');

module.exports = function memoizeLast(func, maxSize, cacheKey) {
  return mem(func, { cache: new QuickLRU({ maxSize: maxSize || 1 }), cacheKey: cacheKey });
};
