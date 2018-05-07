const Database = require('../stores/database');
const serverSettings = require('./server-settings');
const commonBootstrapper = require('./common-bootstrapper');

async function createContainer() {
  const container = await commonBootstrapper.createContainer();
  container.registerInstance(Database, await Database.create(serverSettings.elmuWebConnectionString));
  return container;
}

module.exports = {
  createContainer
};
