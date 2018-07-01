const Cdn = require('../repositories/cdn');
const Database = require('../stores/database');
const serverSettings = require('./server-settings');
const commonBootstrapper = require('./common-bootstrapper');

async function createContainer() {
  const container = await commonBootstrapper.createContainer();

  const database = await Database.create({
    connectionString: serverSettings.elmuWebConnectionString
  });

  container.registerInstance(Database, database);

  const cdn = await Cdn.create({
    endpoint: serverSettings.cdnEndpoint,
    region: serverSettings.cdnRegion,
    accessKey: serverSettings.cdnAccessKey,
    secretKey: serverSettings.cdnSecretKey,
    bucketName: serverSettings.cdnBucketName,
    rootUrl: serverSettings.cdnRootURL
  });

  container.registerInstance(Cdn, cdn);

  return container;
}

function disposeContainer(container) {
  return Promise.all([
    container.get(Database),
    container.get(Cdn)
  ].map(service => service.dispose()));
}

module.exports = {
  createContainer,
  disposeContainer
};
