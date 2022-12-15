import url from 'node:url';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import Cdn from '../repositories/cdn.js';
import Logger from '../common/logger.js';
import { Container } from '../common/di.js';
import Database from '../stores/database.js';
import ServerConfig from './server-config.js';
import ClientConfig from './client-config.js';
import PageResolver from '../domain/page-resolver.js';
import ThemeManager from '../resources/theme-manager.js';
import lessVariablesToJson from 'less-variables-to-json';
import PluginRegistry from '../plugins/plugin-registry.js';
import ResourceManager from '../resources/resource-manager.js';
import { ensurePreResolvedModulesAreLoaded } from '../utils/pre-resolved-modules.js';

const logger = new Logger(import.meta.url);

const thisDir = path.dirname(url.fileURLToPath(import.meta.url));
const resources = await fs.readFile(path.resolve(thisDir, '../resources/resources.json'), 'utf8').then(JSON.parse);
const globalVariables = await fs.readFile(path.resolve(thisDir, '../styles/global-variables.less'), 'utf8').then(lessVariablesToJson);

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
  const additionalResources = await Promise.all(serverConfig.resources.map(modulePath => fs.readFile(modulePath, 'utf8').then(JSON.parse)));
  const resourceManager = new ResourceManager(resources, ...additionalResources);

  logger.info('Registering resource manager');
  container.registerInstance(ResourceManager, resourceManager);

  logger.info('Loading theme files');
  const themeOverrideVariables = serverConfig.themeFile ? await fs.readFile(serverConfig.themeFile, 'utf8').then(lessVariablesToJson) : null;

  logger.info('Registering theme manager');
  const themeManager = new ThemeManager();
  themeManager.setThemeFromLessVariables({ ...globalVariables, ...themeOverrideVariables });
  container.registerInstance(ThemeManager, themeManager);

  logger.info('Registering page resolver');
  const pageResolver = new PageResolver(serverConfig.bundleConfig);
  await pageResolver.prefillCache();
  container.registerInstance(PageResolver, pageResolver);

  logger.info('Loading plugin editors');
  const pluginRegistry = container.get(PluginRegistry);
  await pluginRegistry.ensureAllEditorsAreLoaded();

  logger.info('Preload modules');
  await ensurePreResolvedModulesAreLoaded();

  return container;
}

export function disposeContainer(container) {
  return container.dispose();
}

export default {
  createContainer,
  disposeContainer
};
