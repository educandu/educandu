const browserHelper = require('../ui/browser-helper');

/* eslint no-process-env: off */

const env = (browserHelper.isBrowser() ? window.env : process.env).ELMU_ENV || 'dev';

const commonSettings = {};

const overrides = {
  dev: {
    cdnRootURL: 'http://localhost:9000/dev-elmu-cdn/'
  },
  test: {
    cdnRootURL: 'http://localhost:9000/test-elmu-cdn/'
  },
  stag: {
    cdnRootURL: 'http://stag-cdn.elmu.online/'
  },
  prod: {
    cdnRootURL: 'http://cdn.elmu.online/'
  }
};

module.exports = Object.assign({}, commonSettings, overrides[env]);
