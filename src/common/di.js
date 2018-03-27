/*
  eslint consistent-return: "off",
         default-case: "off",
         func-names: "off",
         id-length: "off",
         max-params: "off",
         new-parens: "off",
         no-extra-parens: "off",
         no-new-func: "off",
         no-prototype-builtins: "off",
         prefer-spread: "off",
         space-before-blocks: "off"
*/

const aureliaDependencyInjection = require('aurelia-dependency-injection');

const PLATFORM = {};

PLATFORM.global = (function () {
  // Workers don’t have `window`, only `self`
  if (typeof self !== 'undefined') {
    return self;
  }

  if (typeof global !== 'undefined') {
    return global;
  }

  // Not all environments allow eval and Function
  // Use only as a last resort:
  return new Function('return this')();
})();

if (typeof PLATFORM.global.Reflect === 'undefined') {
  PLATFORM.global.Reflect = {};
}

if (typeof Reflect.defineProperty !== 'function') {
  Reflect.defineProperty = function (target, propertyKey, descriptor) {
    if (typeof target === 'object' ? target === null : typeof target !== 'function') {
      throw new TypeError('Reflect.defineProperty called on non-object');
    }

    try {
      Object.defineProperty(target, propertyKey, descriptor);
      return true;
    } catch (e) {
      return false;
    }
  };
}

if (typeof Reflect.construct !== 'function') {
  Reflect.construct = function (Target, args) {
    if (args) {
      switch (args.length){
        case 0: return new Target();
        case 1: return new Target(args[0]);
        case 2: return new Target(args[0], args[1]);
        case 3: return new Target(args[0], args[1], args[2]);
        case 4: return new Target(args[0], args[1], args[2], args[3]);
      }
    }

    const a = [null];
    a.push.apply(a, args);
    return new (Function.prototype.bind.apply(Target, a));
  };
}

if (typeof Reflect.ownKeys !== 'function') {
  Reflect.ownKeys = function (o) {
    return (Object.getOwnPropertyNames(o).concat(Object.getOwnPropertySymbols(o)));
  };
}

const emptyMetadata = Object.freeze({});
const metadataContainerKey = '__metadata__';

if (typeof Reflect.getOwnMetadata !== 'function') {
  Reflect.getOwnMetadata = function (metadataKey, target, targetKey) {
    if (target.hasOwnProperty(metadataContainerKey)) {
      return (target[metadataContainerKey][targetKey] || emptyMetadata)[metadataKey];
    }
  };
}

if (typeof Reflect.defineMetadata !== 'function') {
  Reflect.defineMetadata = function (metadataKey, metadataValue, target, targetKey) {
    const metadataContainer = target.hasOwnProperty(metadataContainerKey) ? target[metadataContainerKey] : (target[metadataContainerKey] = {});
    const targetContainer = metadataContainer[targetKey] || (metadataContainer[targetKey] = {});
    targetContainer[metadataKey] = metadataValue;
  };
}

if (typeof Reflect.metadata !== 'function') {
  Reflect.metadata = function (metadataKey, metadataValue) {
    return function (target, targetKey) {
      Reflect.defineMetadata(metadataKey, metadataValue, target, targetKey);
    };
  };
}

module.exports = aureliaDependencyInjection;
