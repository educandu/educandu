import Cdn from '../repositories/cdn';
import Logger from '../common/logger';
import Database from '../stores/database';
import ElmuServer from '../server/elmu-server';
import ClientSettings from './client-settings';
import ServerSettings from './server-settings';
import commonBootstrapper from './common-bootstrapper';
import ResourceManager from '../resources/resource-manager';
import ServerResourceLoader from '../resources/server-resource-loader';

const logger = new Logger(__filename);

export async function createContainer() {
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

  const resourceLoader = new ServerResourceLoader();
  const resourceBundles = await resourceLoader.loadResourceBundles();
  const resourceManager = new ResourceManager(resourceBundles);

  container.registerInstance(ResourceManager, resourceManager);

  return container;
}

export function disposeContainer(container) {
  logger.info('Disposing container');
  return Promise.all([
    container.get(ElmuServer),
    container.get(Database),
    container.get(Cdn)
  ].map(service => service.dispose()));
}

export default {
  createContainer,
  disposeContainer
};
