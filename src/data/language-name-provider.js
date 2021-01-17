import BaseDataProvider from './base-data-provider';
import languageNamesEn from './language-names/en.json';
import languageNamesDe from './language-names/de.json';

class LanguageNameProvider extends BaseDataProvider {
  constructor() {
    super({
      en: languageNamesEn,
      de: languageNamesDe
    });
  }
}

export default LanguageNameProvider;
