import url from 'url';
import glob from 'glob';
import path from 'path';
import yaml from 'yaml';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import Logger from '../common/logger.js';

const logger = new Logger(import.meta.url);

const RESOURCES_SEARCH_PATTERN = url.fileURLToPath(new URL('../**/*.yml', import.meta.url));

const kebabToCamel = str => str.replace(/-[a-z0-9]/g, c => c.toUpperCase()).replace(/-/g, '');

class ResourceLoader {
  async loadResourceBundles() {
    const filePaths = await promisify(glob)(RESOURCES_SEARCH_PATTERN);

    const bundleGroups = await Promise.all(filePaths.map(async filePath => {
      const namespace = kebabToCamel(path.basename(filePath, '.yml'));
      logger.info('Loading resources %s', namespace);
      const yamlContent = await this._loadYaml(filePath);
      return this._createResourceBundles(yamlContent, namespace);
    }));

    return bundleGroups.flatMap(x => x);
  }

  async _loadYaml(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    return yaml.parse(content);
  }

  _createResourceBundles(resources, namespace) {
    if (!resources) {
      return [];
    }

    const bundlesByLanguage = {};

    const resourceKeys = Object.keys(resources);
    resourceKeys.forEach(resourceKey => {
      const languages = Object.keys(resources[resourceKey]);
      languages.forEach(language => {
        let languageBundle = bundlesByLanguage[language];
        if (!languageBundle) {
          languageBundle = {
            namespace,
            language,
            resources: {}
          };
          bundlesByLanguage[language] = languageBundle;
        }
        languageBundle.resources[resourceKey] = resources[resourceKey][language];
      });
    });

    return Object.values(bundlesByLanguage);
  }
}

export default ResourceLoader;
