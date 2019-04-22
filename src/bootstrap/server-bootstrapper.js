const Cdn = require('../repositories/cdn');
const Logger = require('../common/logger');
const Database = require('../stores/database');
const ElmuServer = require('../server/elmu-server');
const ClientSettings = require('./client-settings');
const ServerSettings = require('./server-settings');
const commonBootstrapper = require('./common-bootstrapper');

const logger = new Logger(__filename);

async function createContainer() {
  logger.info('Creating container');
  const container = await commonBootstrapper.createContainer();

  const serverSettings = container.get(ServerSettings);

  const clientSettings = new ClientSettings(serverSettings.exportClientSettingValues());
  container.registerInstance(ClientSettings, clientSettings);

  logger.info('Establishing database connection');
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
    rootUrl: serverSettings.cdnRootUrl
  });

  container.registerInstance(Cdn, cdn);

  return container;
}

function disposeContainer(container) {
  logger.info('Disposing container');
  return Promise.all([
    container.get(ElmuServer),
    container.get(Database),
    container.get(Cdn)
  ].map(service => service.dispose()));
}

module.exports = {
  createContainer,
  disposeContainer
};
