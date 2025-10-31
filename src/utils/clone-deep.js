function isObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function isArray(value) {
  return Array.isArray(value);
}

function isFunction(value) {
  return typeof value === 'function';
}

function isDate(value) {
  return value instanceof Date;
}

function isPrimitiveType(value) {
  return ['undefined', 'string', 'number', 'bigint', 'boolean'].includes(typeof value);
}

function cloneDeepFallback(value) {
  if (isPrimitiveType(value) || isFunction(value) || value === null) {
    return value;
  }

  if (isDate(value)) {
    return new Date(value.getTime());
  }

  if (isArray(value)) {
    return value.map(item => cloneDeepFallback(item));
  }

  if (isObject(value)) {
    return Object.entries(value).reduce((clone, entry) => {
      clone[entry[0]] = cloneDeepFallback(entry[1]);
      return clone;
    }, {});
  }

  throw new Error(`Cannot clone value of type ${Object.prototype.toString.call(value)}`);
}

// Use structuredClone if available (modern browsers and Node.js 17+)
const cloneDeep = typeof structuredClone === 'function'
  ? structuredClone
  : cloneDeepFallback;

export default cloneDeep;
