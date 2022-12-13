import languageDataEn from './language-data-en.js';
import languageDataDe from './language-data-de.js';

const languageDataMap = {
  en: languageDataEn,
  de: languageDataDe
};

class LanguageDataProvider {
  _getRawData(inWhichLanguage) {
    const data = languageDataMap[inWhichLanguage];
    if (!data) {
      throw new Error(`Language data for '${inWhichLanguage}' is not available`);
    }

    return data;
  }

  getAllLanguageData(inWhichLanguage) {
    return this._getRawData(inWhichLanguage);
  }

  getLanguageData(forLanguage, inWhichLanguage) {
    return this._getRawData(inWhichLanguage)[forLanguage];
  }
}

export default LanguageDataProvider;
