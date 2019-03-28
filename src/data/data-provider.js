const countryNamesEn = require('./country-names/en.json');
const countryNamesDe = require('./country-names/de.json');

const dataDictionaries = {
  'country-names': {
    en: countryNamesEn,
    de: countryNamesDe
  }
};

class DataProvider {
  getData(key, language) {
    const dict = dataDictionaries[key];
    if (!dict) {
      throw new Error(`Data with key ${key} and language ${language} not found`);
    }

    const data = dict[language];
    if (!data) {
      throw new Error(`Data with key ${key} and language ${language} not found`);
    }

    return data;
  }
}

module.exports = DataProvider;
