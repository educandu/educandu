import Logger from './logger.js';

const logger = new Logger(import.meta.url);

const keyToString = key => (key.name || key).toString();

export const getDisposalInfo = Symbol('getDisposalInfo');

export const DISPOSAL_PRIORITY = {
  server: 100,
  domain: 200,
  storage: 300
};

class InstanceResolver {
  constructor(instance) {
    this._instance = instance;
    this.hasInstance = true;
  }

  resolve() {
    return this._instance;
  }
}

class ServiceResolver {
  constructor(container, ctor) {
    this._container = container;
    this._ctor = ctor;
    this._instance = null;
    this.hasInstance = false;
  }

  resolve(resolveChain) {
    if (!this.hasInstance) {
      this._checkForCircularDependency(resolveChain);

      const deps = this._getDependencies();
      const nextChain = resolveChain ? [...resolveChain, this._ctor] : [this._ctor];
      const args = deps.map(dep => this._container._resolve(dep, nextChain));
      const Service = this._ctor;
      this._instance = new Service(...args);

      this.hasInstance = true;
    }

    return this._instance;
  }

  _getDependencies() {
    const inject = this._ctor.inject;
    const deps = typeof inject === 'function' ? inject() : inject;
    return Array.isArray(deps) ? deps : [];
  }

  _checkForCircularDependency(resolveChain) {
    if (!resolveChain || !resolveChain.length) {
      return;
    }

    const myIndex = resolveChain.indexOf(this._ctor);
    if (myIndex !== -1) {
      const depCircle = [...resolveChain.slice(myIndex), this._ctor];
      const depCircleString = depCircle.map(keyToString).join(' -> ');
      throw new Error(`Circular dependency: ${depCircleString}`);
    }
  }
}

export class Container {
  constructor() {
    this._resolversByKey = new Map();
    this._resolversByService = new Map();
    this.registerInstance(Container, this);
  }

  get(key) {
    return this._resolve(key, null);
  }

  registerInstance(key, instance) {
    this._registerResolver(key, new InstanceResolver(instance));
  }

  registerService(key, ctor) {
    let resolver = this._resolversByService.get(ctor);
    if (!resolver) {
      resolver = new ServiceResolver(this, ctor);
      this._resolversByService.set(ctor, resolver);
    }

    this._registerResolver(key, resolver);
  }

  async dispose() {
    const resolvers = [...this._resolversByKey.values()];

    this._resolversByKey = null;
    this._resolversByService = null;

    const allResolvedObjects = resolvers
      .filter(resolver => resolver.hasInstance)
      .map(resolver => resolver.resolve())
      .filter(obj => obj && typeof obj[getDisposalInfo] === 'function');

    const uniqueObjects = [...new Set(allResolvedObjects)];

    const disposalGroups = uniqueObjects.map(obj => obj[getDisposalInfo]())
      .reduce((acc, value) => {
        acc.set(value.priority, [...acc.get(value.priority) || [], value.dispose]);
        return acc;
      }, new Map());

    const sortedDisposalPriorities = [...disposalGroups.keys()].sort();

    for (const priority of sortedDisposalPriorities) {
      const disposalGroup = disposalGroups.get(priority);

      logger.debug(`Disposing ${disposalGroup.length} items in priority group ${priority}`);

      /* eslint-disable-next-line no-await-in-loop */
      await Promise.all(disposalGroup.map(dispose => dispose()));
    }
  }

  _registerResolver(key, resolver) {
    this._resolversByKey.set(key, resolver);
  }

  _resolve(key, resolveChain) {
    let resolver = this._resolversByKey.get(key);
    if (typeof resolver === 'undefined') {
      resolver = this._createResolver(key);
      this._registerResolver(key, resolver);
    }

    return resolver.resolve(resolveChain);
  }

  _createResolver(key) {
    if (key === null || typeof key === 'undefined') {
      throw new Error('key must not be null or undefined');
    }

    return typeof key === 'function'
      ? new ServiceResolver(this, key)
      : new InstanceResolver(key);
  }
}
