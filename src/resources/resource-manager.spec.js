import { describe, expect, it } from 'vitest';
import ResourceManager from './resource-manager.js';

const bundle1 = [
  {
    namespace: 'loginLogout',
    language: 'en',
    resources: {
      login: 'Login',
      logout: 'Logout'
    }
  },
  {
    namespace: 'loginLogout',
    language: 'de',
    resources: {
      login: 'Anmelden',
      logout: 'Abmelden'
    }
  }
];

const bundle2 = [
  {
    namespace: 'loginLogout',
    language: 'en',
    resources: {
      logout: 'Say goodbye',
      extraKey: 'Not used'
    }
  },
  {
    namespace: 'loginLogout',
    language: 'de',
    resources: {
      login: 'Reinspaziert'
    }
  }
];

const bundle1and2merged = [
  {
    namespace: 'loginLogout',
    language: 'en',
    resources: {
      login: 'Login',
      logout: 'Say goodbye',
      extraKey: 'Not used'
    }
  },
  {
    namespace: 'loginLogout',
    language: 'de',
    resources: {
      login: 'Reinspaziert',
      logout: 'Abmelden'
    }
  }
];

describe('resource-manager', () => {

  describe('when initialized without any bundles', () => {
    it('should have no resources', () => {
      const sut = new ResourceManager();
      const result = sut.getAllResourceBundles();
      expect(result).toHaveLength(0);
    });
  });

  describe('when initialized with a bundle', () => {
    it('should have the resources of that bundle', () => {
      const sut = new ResourceManager(bundle1);
      const result = sut.getAllResourceBundles();
      expect(result).toEqual(bundle1);
    });
  });

  describe('when initialized with multiple bundles', () => {
    it('should have the merged resources of those bundles', () => {
      const sut = new ResourceManager(bundle1, bundle2);
      const result = sut.getAllResourceBundles();
      expect(result).toEqual(bundle1and2merged);
    });
  });

});
