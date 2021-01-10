class BaseDataProvider {
  constructor(data) {
    this._data = data;
  }

  getData(language) {
    const langData = this._data[language];
    if (!langData) {
      throw new Error(`Language ${language} is not available`);
    }

    return langData;
  }
}

export default BaseDataProvider;
