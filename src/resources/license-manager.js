class LicenseManager {
  constructor() {
    this._licenses = {};
    this._licenseMap = new Map();
  }

  getLicenses() {
    return this._licenses;
  }

  getLicenseByKey(key) {
    return this._licenseMap.get(key);
  }

  setLicenses(licenses) {
    this._licenses = licenses;
    this._regenerateMap();
  }

  setLicensesFromSpdxLicenseList(spdxLicenseList, allowedLicenses) {
    this._licenses = [...new Set(allowedLicenses)].map(key => {
      const foundLicense = spdxLicenseList[key];
      if (!foundLicense) {
        throw new Error(`Could not find license '${key}'`);
      }

      return {
        key,
        name: foundLicense.name,
        url: foundLicense.url
      };
    });
    this._regenerateMap();
  }

  _regenerateMap() {
    this._licenseMap = new Map(this._licenses.map(license => [license.key, license]));
  }
}

export default LicenseManager;
