const CDN_APPLICATION_PREFIX = 'plugins/h5p-player/apps';

// Returns in library Directory format, e.g. 'H5P.Blanks-1.8'
function dependencyToDirName(dep) {
  return `${dep.machineName}-${dep.majorVersion}.${dep.minorVersion}`;
}

// Returns in format as used for content integration, e.g. 'H5P.Blanks 1.8'
function dependencyToClientSideName(dep) {
  return `${dep.machineName} ${dep.majorVersion}.${dep.minorVersion}`;
}

module.exports = {
  CDN_APPLICATION_PREFIX,
  dependencyToDirName,
  dependencyToClientSideName
};
