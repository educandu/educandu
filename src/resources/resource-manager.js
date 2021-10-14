import i18next from 'i18next';
import icu from 'i18next-icu';
import { initReactI18next } from 'react-i18next';
import { SUPPORTED_UI_LANGUAGES } from './ui-language';

const DEFAULT_NAMESPACE = 'default';

class ResourceManager {
  constructor(resourceBundles) {
    this._resourceBundles = resourceBundles;
  }

  getAllResourceBundles() {
    return this._resourceBundles;
  }

  getSupportedLanguages() {
    return SUPPORTED_UI_LANGUAGES;
  }

  createI18n(initialLanguage) {
    const instance = i18next.createInstance();
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
    this._resourceBundles.forEach(bundle => {
      instance.addResourceBundle(bundle.language, bundle.namespace, bundle.resources);
    });
    return instance;
  }
}

export default ResourceManager;
