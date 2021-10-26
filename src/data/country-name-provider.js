import countryNamesEn from './country-names/en.json';
import countryNamesDe from './country-names/de.json';
import BaseDataProvider from './base-data-provider.js';

class CountryNameProvider extends BaseDataProvider {
  constructor() {
    super({
      en: countryNamesEn,
      de: countryNamesDe
    });
  }
}

export default CountryNameProvider;
