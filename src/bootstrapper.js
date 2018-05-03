const settings = require('./settings');
const { Container } = require('./common/di');
const Database = require('./stores/database');

async function createContainer() {
  const container = new Container();
  container.registerInstance(Database, await Database.create(settings.elmuWebConnectionString));
  return container;
}

module.exports = {
  createContainer
};
