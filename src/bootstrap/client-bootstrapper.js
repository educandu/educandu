const commonBootstrapper = require('./common-bootstrapper');

async function createContainer() {
  const container = await commonBootstrapper.createContainer();
  return container;
}

module.exports = {
  createContainer
};
