class LicenseManager {
  constructor() {
    this._licenses = {};
  }

  getLicenses() {
    return this._licenses;
  }

  setLicenses(licenses) {
    this._licenses = licenses;
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
  }
}

export default LicenseManager;
