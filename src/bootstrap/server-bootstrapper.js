import Cdn from '../repositories/cdn.js';
import Logger from '../common/logger.js';
import Database from '../stores/database.js';
import ServerConfig from './server-config.js';
import ClientConfig from './client-config.js';
import ElmuServer from '../server/elmu-server.js';
import commonBootstrapper from './common-bootstrapper.js';
import ResourceManager from '../resources/resource-manager.js';
import ServerResourceLoader from '../resources/server-resource-loader.js';

const logger = new Logger(import.meta.url);

export async function createContainer(config = null) {
  logger.info('Creating container');
  const container = await commonBootstrapper.createContainer();

  const serverConfig = config || container.get(ServerConfig);

  const clientConfig = new ClientConfig(serverConfig.exportClientConfigValues());
  container.registerInstance(ClientConfig, clientConfig);

  logger.info('Establishing database connection');
  const database = await Database.create({
    connectionString: serverConfig.elmuWebConnectionString,
    runDbMigration: serverConfig.runDbMigration
  });

  container.registerInstance(Database, database);

  logger.info('Creating Cdn');
  const cdn = await Cdn.create({
    endpoint: serverConfig.cdnEndpoint,
    region: serverConfig.cdnRegion,
    accessKey: serverConfig.cdnAccessKey,
    secretKey: serverConfig.cdnSecretKey,
    bucketName: serverConfig.cdnBucketName,
    rootUrl: serverConfig.cdnRootUrl
  });

  logger.info('Registering Cdn');
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
