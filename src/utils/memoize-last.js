const mem = require('mem');
const QuickLRU = require('quick-lru');

module.exports = function memoizeLast(func, maxSize, cacheKey) {
  return mem(func, { cache: new QuickLRU({ maxSize: maxSize || 1 }), cacheKey: cacheKey });
};
