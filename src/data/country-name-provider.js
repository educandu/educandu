import BaseDataProvider from './base-data-provider';
import countryNamesEn from './country-names/en.json';
import countryNamesDe from './country-names/de.json';

class CountryNameProvider extends BaseDataProvider {
  constructor() {
    super({
      en: countryNamesEn,
      de: countryNamesDe
    });
  }
}

export default CountryNameProvider;
