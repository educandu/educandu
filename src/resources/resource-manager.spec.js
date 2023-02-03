import { describe, expect, it } from 'vitest';
import ResourceManager from './resource-manager.js';

const translationObjectOriginal = {
  loginLogout: {
    login: {
      en: 'Log in',
      de: 'Anmelden'
    },
    logout: {
      en: 'Logout',
      de: 'Abmelden'
    }
  }
};

const translationObjectOverrides = {
  loginLogout: {
    login: {
      de: 'Reinspaziert'
    },
    logout: {
      en: 'Say goodbye'
    }
  }
};

const expectedResourcesOriginal = [
  {
    namespace: 'loginLogout',
    language: 'en',
    resources: {
      login: 'Log in',
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

const expectedResourcesOverriden = [
  {
    namespace: 'loginLogout',
    language: 'en',
    resources: {
      login: 'Log in',
      logout: 'Say goodbye'
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

  describe('when initialized without any translations', () => {
    it('should have no resources', () => {
      const sut = new ResourceManager();
      const result = sut.getResources();
      expect(result).toHaveLength(0);
    });
  });

  describe('when initialized with a translation object', () => {
    it('should have the resources of that translation object', () => {
      const sut = new ResourceManager();
      sut.setResourcesFromTranslations([translationObjectOriginal]);
      const result = sut.getResources();
      expect(result).toEqual(expectedResourcesOriginal);
    });
  });

  describe('when initialized with multiple translation objects', () => {
    it('should have the merged resources of those translation objects', () => {
      const sut = new ResourceManager();
      sut.setResourcesFromTranslations([translationObjectOriginal, translationObjectOverrides]);
      const result = sut.getResources();
      expect(result).toEqual(expectedResourcesOverriden);
    });
  });

});
