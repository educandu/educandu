/* eslint no-process-env: off */

const env = process.env.ELMU_ENV || 'dev';

const commonSettings = {
  env: env,
  port: 3000
};

const overrides = {
  dev: {
    elmuWebConnectionString: 'mongodb://elmu:elmu@localhost:27017/dev-elmu-web?authSource=admin'
  },
  test: {
    elmuWebConnectionString: 'mongodb://elmu:elmu@localhost:27017/test-elmu-web?authSource=admin'
  },
  stag: {
    elmuWebConnectionString: process.env.ELMU_WEB_CONNECTION_STRING
  },
  prod: {
    elmuWebConnectionString: process.env.ELMU_WEB_CONNECTION_STRING
  }
};

module.exports = Object.assign({}, commonSettings, overrides[env]);
