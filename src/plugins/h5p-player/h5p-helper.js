/* eslint no-warning-comments: 0 */
/* eslint no-use-before-define: 0 */
/* eslint curly: 0 */

const os = require('os');
const fs = require('fs');
const path = require('path');
const util = require('util');
const toposort = require('toposort');
const decompress = require('decompress');
const uniqueId = require('../../utils/unique-id');
const recursiveReaddir = require('recursive-readdir');

const DEFAULT_CONTENT_ID = '1';

async function install(h5pFileName, cdn, tempDir = os.tmpdir(), applicationId = uniqueId.create(), contentId = DEFAULT_CONTENT_ID) {
  const applicationDir = path.join(tempDir, `./elmu-h5p-tmp-${applicationId}`);
  const elmuInfoPath = path.join(applicationDir, './_elmu-info.json');

  const map = file => {
    file.path = rewriteH5pFolderFilePath(file.path, contentId);
    return file;
  };

  await decompress(h5pFileName, applicationDir, { map });

  const elmuInfo = await createElmuInfo(applicationDir, contentId);
  await writeJson(elmuInfoPath, elmuInfo);

  if (cdn) {
    await uploadFolderToCdn(cdn, applicationDir, applicationId);
  }

  return {
    applicationId
  };
}

function rewriteH5pFolderFilePath(filePath, contentId) {
  const unixStylePath = filePath.replace(/\\/g, '/');

  // Just simple files without directory
  if (/^[^/]+$/.test(unixStylePath)) {
    return unixStylePath;
  }

  // Any file that is in the `content` directory
  if (/^content(\/[^/]+)*$/.test(unixStylePath)) {
    return unixStylePath.replace(/^content/, `content/${contentId}`);
  }

  // Otherwise, it can only be a library file
  return `libraries/${unixStylePath}`;
}

async function createElmuInfo(applicationDir, contentId) {
  const manifestPath = path.join(applicationDir, './h5p.json');
  const contentPath = path.join(applicationDir, `./content/${contentId}/content.json`);

  const manifest = await loadJson(manifestPath);
  const content = await loadJson(contentPath);
  const dependencies = await collectDependencies(applicationDir, manifest.preloadedDependencies || []);

  return {
    manifest,
    content,
    dependencies
  };
}

async function collectDependencies(applicationDir, preloadedDependencies) {
  const preloadedLibs = preloadedDependencies.map(dependencyToDirName);

  const libMap = new Map();
  await Promise.all(preloadedLibs.map(lib => addLibraryToMap(lib, libMap, applicationDir)));

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

async function addLibraryToMap(libName, map, applicationDir) {
  if (map.has(libName)) return;

  const libFileName = path.join(applicationDir, `./libraries/${libName}/library.json`);
  const libFile = await loadJson(libFileName);
  const preloadedJs = [];
  const preloadedCss = [];
  const preloadedDependencies = [];

  preloadedJs.push(...(libFile.preloadedJs || []).map(dep => path.join('libraries', libName, dep.path)));
  preloadedCss.push(...(libFile.preloadedCss || []).map(dep => path.join('libraries', libName, dep.path)));
  preloadedDependencies.push(...(libFile.preloadedDependencies || []).map(dependencyToDirName));
  map.set(libName, { preloadedJs, preloadedCss, preloadedDependencies });

  await Promise.all(preloadedDependencies.map(lib => addLibraryToMap(lib, map, applicationDir)));
}

async function uploadFolderToCdn(cdn, applicationDir, applicationId) {
  const prefix = getPrefixForApplicationId(applicationId);
  const files = await recursiveReaddir(applicationDir);
  const uploads = files.map(file => {
    const objectName = path.join(prefix, path.relative(applicationDir, file));
    return cdn.uploadObject(objectName, file, {});
  });

  await Promise.all(uploads);
}

async function createIntegration(applicationId, baseUrl, h5pLibRootUrl, applicationRootUrl, cdn, contentId = DEFAULT_CONTENT_ID) {
  const prefix = getPrefixForApplicationId(applicationId);
  const elmuInfoFile = `${prefix}/_elmu-info.json`;
  const elmuInfoFileString = await cdn.getObjectAsString(elmuInfoFile, 'utf8');
  const { dependencies, content, manifest } = JSON.parse(elmuInfoFileString);

  return {
    baseUrl: baseUrl, // No trailing slash
    url: `${applicationRootUrl}/${applicationId}`, // Relative to web root
    siteUrl: `${baseUrl}/`, // Only if NOT logged in!
    postUserStatistics: false,
    l10n: {},
    loadedJs: [],
    loadedCss: [],
    core: {
      scripts: [
        `${h5pLibRootUrl}/js/jquery.js`,
        `${h5pLibRootUrl}/js/h5p.js`,
        `${h5pLibRootUrl}/js/h5p-event-dispatcher.js`,
        `${h5pLibRootUrl}/js/h5p-x-api-event.js`,
        `${h5pLibRootUrl}/js/h5p-x-api.js`,
        `${h5pLibRootUrl}/js/h5p-content-type.js`,
        `${h5pLibRootUrl}/js/h5p-confirmation-dialog.js`,
        `${h5pLibRootUrl}/js/h5p-action-bar.js`
      ],
      styles: [
        `${h5pLibRootUrl}/styles/h5p.css`,
        `${h5pLibRootUrl}/styles/h5p-confirmation-dialog.css`,
        `${h5pLibRootUrl}/styles/h5p-core-button.css`
      ]
    },
    contents: {
      [`cid-${contentId}`]: {
        library: getMainLibraryForContent(manifest),
        jsonContent: JSON.stringify(content),
        fullScreen: false, // No fullscreen support
        mainId: contentId,
        url: `${applicationRootUrl}/${applicationId}`,
        title: manifest.title,
        contentUserData: null,
        displayOptions: {
          frame: false, // Show frame and buttons below H5P
          export: false, // Display download button
          embed: false, // Display embed button
          copyright: true, // Display copyright button
          icon: false // Display H5P icon
        },
        styles: dependencies.preloadedCss.map(p => `${applicationRootUrl}/${applicationId}/${p}`),
        scripts: dependencies.preloadedJs.map(p => `${applicationRootUrl}/${applicationId}/${p}`)
      }
    }
  };
}

function getPrefixForApplicationId(applicationId) {
  return `plugins/h5p-player/content/${applicationId}`;
}

function getMainLibraryForContent(manifest) {
  const mainLibName = manifest.mainLibrary;
  const mainDep = manifest.preloadedDependencies.find(dep => dep.machineName === mainLibName);
  return dependencyToClientSideName(mainDep);
}


// Returns in library Directory format, e.g. 'H5P.Blanks-1.8'
function dependencyToDirName(dep) {
  return `${dep.machineName}-${dep.majorVersion}.${dep.minorVersion}`;
}

// Returns in format as used for content integration, e.g. 'H5P.Blanks 1.8'
function dependencyToClientSideName(dep) {
  return `${dep.machineName} ${dep.majorVersion}.${dep.minorVersion}`;
}

async function loadJson(fileName) {
  return JSON.parse(await util.promisify(fs.readFile)(fileName, 'utf8'));
}

function writeJson(fileName, content) {
  return util.promisify(fs.writeFile)(fileName, JSON.stringify(content), 'utf8');
}

module.exports = {
  install,
  createIntegration
};
