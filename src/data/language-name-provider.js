import BaseDataProvider from './base-data-provider.js';
import languageNamesEn from './language-names/en.json' assert { type: "json" };
import languageNamesDe from './language-names/de.json' assert { type: "json" };

class LanguageNameProvider extends BaseDataProvider {
  constructor() {
    super({
      en: languageNamesEn,
      de: languageNamesDe
    });
  }
}

export default LanguageNameProvider;
