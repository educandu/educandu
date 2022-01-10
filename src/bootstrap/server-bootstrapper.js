import Cdn from '../repositories/cdn.js';
import Logger from '../common/logger.js';
import { Container } from '../common/di.js';
import Database from '../stores/database.js';
import ServerConfig from './server-config.js';
import ClientConfig from './client-config.js';
import resources from '../resources/resources.json';
import PageResolver from '../domain/page-resolver.js';
import ResourceManager from '../resources/resource-manager.js';

const logger = new Logger(import.meta.url);

export async function createContainer(configValues = {}) {
  logger.info('Creating container');
  const container = new Container();

  const serverConfig = new ServerConfig(configValues);
  container.registerInstance(ServerConfig, serverConfig);

  const clientConfig = new ClientConfig(serverConfig.exportClientConfigValues());
  container.registerInstance(ClientConfig, clientConfig);

  logger.info('Establishing database connection');
  const database = await Database.create({
    connectionString: serverConfig.mongoConnectionString
  });

  logger.info('Registering database');
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

  logger.info('Registering CDN');
  container.registerInstance(Cdn, cdn);

  logger.info('Loading resources');
  const additionalResources = await Promise.all(serverConfig.resources.map(async moduleUrl => {
    const module = await import(moduleUrl);
    return module.default;
  }));

  const resourceManager = new ResourceManager(resources, ...additionalResources);

  logger.info('Registering resource manager');
  container.registerInstance(ResourceManager, resourceManager);

  logger.info('Registering page resolver');
  const pageResolver = new PageResolver(serverConfig.bundleConfig);
  await pageResolver.prefillCache();
  container.registerInstance(PageResolver, pageResolver);

  return container;
}

export function disposeContainer(container) {
  return container.dispose();
}

export default {
  createContainer,
  disposeContainer
};
