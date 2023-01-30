import icu from 'i18next-icu';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { SUPPORTED_UI_LANGUAGES } from './ui-language.js';

const DEFAULT_NAMESPACE = 'default';

class ResourceManager {
  constructor() {
    this._resources = [];
  }

  getResources() {
    return this._resources;
  }

  setResources(resources) {
    this._resources = resources;
  }

  setResourcesFromTranslations(translationObjects) {
    const resultMap = new Map();

    for (const translationObject of translationObjects) {
      for (const [namespace, keys] of Object.entries(translationObject)) {
        for (const [key, languages] of Object.entries(keys)) {
          for (const [language, value] of Object.entries(languages)) {
            const resultMapKey = `${language}|${namespace}`;
            let bundle = resultMap.get(resultMapKey);
            if (!bundle) {
              bundle = { namespace, language, resources: {} };
              resultMap.set(resultMapKey, bundle);
            }
            bundle.resources[key] = value;
          }
        }
      }
    }

    this._resources = [...resultMap.values()];
  }

  createI18n(initialLanguage) {
    const instance = createInstance();
    instance.use(initReactI18next);
    instance.use(icu);
    instance.init({
      resources: {},
      lng: initialLanguage,
      supportedLngs: SUPPORTED_UI_LANGUAGES,
      defaultNS: DEFAULT_NAMESPACE,
      keySeparator: false,
      interpolation: {
        escapeValue: false
      },
      initImmediate: true
    });
    this._resources.forEach(bundle => {
      instance.addResourceBundle(bundle.language, bundle.namespace, bundle.resources);
    });
    return instance;
  }
}

export default ResourceManager;
