import os from 'os';
import del from 'del';
import path from 'path';
import toposort from 'toposort';
import decompress from 'decompress';
import h5pHelper from './h5p-helper';
import Cdn from '../../repositories/cdn';
import Logger from '../../common/logger';
import uniqueId from '../../utils/unique-id';
import recursiveReaddir from 'recursive-readdir';
import { readJson, writeJson } from '../../utils/file-helper';

const logger = new Logger(__filename);

class H5pFileProcessor {
  static get inject() { return [Cdn]; }

  constructor(cdn) {
    this.cdn = cdn;
    this.tempDir = os.tmpdir();
  }

  async uninstall(applicationId) {
    await this.pruneApplicationDirInCdn(applicationId);
  }

  async install(h5pFileName, contentId, applicationId = uniqueId.create()) {
    const applicationDir = path.join(this.tempDir, `./elmu-h5p-tmp-${applicationId}`);

    await this.unzipH5pFileToApplicationDir(h5pFileName, applicationDir, contentId);
    await this.createElmuInfo(applicationDir, contentId);
    await this.uploadApplicationDirToCdn(applicationDir, applicationId, {});
    await this.cleanupTempFiles(applicationDir);

    return {
      applicationId,
      contentId
    };
  }

  async unzipH5pFileToApplicationDir(h5pFileName, applicationDir, contentId) {
    const map = file => {
      file.path = this.rewriteH5pFolderFilePath(file.path, contentId);
      return file;
    };

    await decompress(h5pFileName, applicationDir, { map });
  }

  rewriteH5pFolderFilePath(filePath, contentId) {
    const unixStylePath = filePath.replace(/\\/g, '/');

    // Just simple files without directory
    if ((/^[^/]+$/).test(unixStylePath)) {
      return unixStylePath;
    }

    // Any file that is in the `content` directory
    if ((/^content(\/[^/]+)*$/).test(unixStylePath)) {
      return unixStylePath.replace(/^content/, `content/${contentId}`);
    }

    // Otherwise, it can only be a library file
    return `libraries/${unixStylePath}`;
  }

  async createElmuInfo(applicationDir, contentId) {
    const manifestPath = path.join(applicationDir, './h5p.json');
    const contentPath = path.join(applicationDir, `./content/${contentId}/content.json`);
    const elmuInfoPath = path.join(applicationDir, './_elmu-info.json');

    const manifest = await readJson(manifestPath);
    const content = await readJson(contentPath);
    const dependencies = await this.collectDependencies(applicationDir, manifest.preloadedDependencies || []);

    await writeJson(elmuInfoPath, { manifest, content, dependencies });
  }

  async collectDependencies(applicationDir, preloadedDependencies) {
    const preloadedLibs = preloadedDependencies.map(h5pHelper.dependencyToDirName);

    const libMap = new Map();
    await Promise.all(preloadedLibs.map(lib => this.tryAddLibraryToMap(lib, libMap, applicationDir)));

    const nodes = Array.from(libMap.keys());
    const edges = [];
    libMap.forEach((value, key) => {
      value.preloadedDependencies.forEach(dep => {
        edges.push([dep, key]);
      });
    });

    const orderedLibNames = toposort.array(nodes, edges);

    const preloadedJs = [];
    const preloadedCss = [];
    orderedLibNames.map(libName => libMap.get(libName)).forEach(lib => {
      preloadedJs.push(...lib.preloadedJs);
      preloadedCss.push(...lib.preloadedCss);
    });

    return { preloadedJs, preloadedCss };
  }

  async tryAddLibraryToMap(libName, map, applicationDir) {
    if (map.has(libName)) {
      return;
    }

    const libFileName = path.join(applicationDir, `./libraries/${libName}/library.json`);
    const libFile = await readJson(libFileName);
    const preloadedJs = [];
    const preloadedCss = [];
    const preloadedDependencies = [];

    preloadedJs.push(...(libFile.preloadedJs || []).map(dep => path.join('libraries', libName, dep.path)));
    preloadedCss.push(...(libFile.preloadedCss || []).map(dep => path.join('libraries', libName, dep.path)));
    preloadedDependencies.push(...(libFile.preloadedDependencies || []).map(h5pHelper.dependencyToDirName));
    map.set(libName, { preloadedJs, preloadedCss, preloadedDependencies });

    await Promise.all(preloadedDependencies.map(lib => this.tryAddLibraryToMap(lib, map, applicationDir)));
  }

  async uploadApplicationDirToCdn(applicationDir, applicationId, metadata) {
    const cdnApplicationPath = `${h5pHelper.CDN_APPLICATION_PREFIX}/${applicationId}`;
    const files = await recursiveReaddir(applicationDir);
    const uploads = files.map(file => {
      const objectName = path.join(cdnApplicationPath, path.relative(applicationDir, file));
      return this.cdn.uploadObject(objectName, file, { ...metadata });
    });

    await Promise.all(uploads);
  }

  cleanupTempFiles(applicationDir) {
    return del(`${applicationDir}/**`, { force: true });
  }

  async pruneApplicationDirInCdn(applicationId) {
    logger.debug('Pruning application with ID %s', applicationId);
    const cdnApplicationPath = `${h5pHelper.CDN_APPLICATION_PREFIX}/${applicationId}`;
    logger.debug('Application path to prune is %s', cdnApplicationPath);
    const objects = await this.cdn.listObjects({ prefix: cdnApplicationPath, recursive: true });
    const objectNames = objects.map(object => object.name);
    objectNames.forEach(name => logger.debug('Pruning object %s', name));
    await this.cdn.deleteObjects(objectNames);
    logger.debug('Application %s has been pruned', applicationId);
  }
}

export default H5pFileProcessor;
