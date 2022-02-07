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

function cloneDeep(value) {
  if (isPrimitiveType(value) || isFunction(value) || value === null) {
    return value;
  }

  if (isDate(value)) {
    return new Date(value.getTime());
  }

  if (isArray(value)) {
    return value.map(item => cloneDeep(item));
  }

  if (isObject(value)) {
    return Object.entries(value).reduce((clone, entry) => {
      clone[entry[0]] = cloneDeep(entry[1]);
      return clone;
    }, {});
  }

  throw new Error(`Cannot clone value of type ${Object.prototype.toString.call(value)}`);
}

export default cloneDeep;
