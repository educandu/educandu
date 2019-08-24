const H5pFileProcessor = require('./h5p-file-processor');
const Logger = require('../../common/logger');

const logger = new Logger(__filename);

class H5pPlayer {
  static get inject() { return [H5pFileProcessor]; }

  static get typeName() { return 'h5p-player'; }

  constructor(h5pFileProcessor) {
    this.h5pFileProcessor = h5pFileProcessor;
  }

  handleAfterHardDelete(originalSection) {
    logger.info('Deleting applications for section with ID %s', originalSection._id);
    const languages = Object.keys(originalSection.content || {});
    const applicationIds = Array.from(new Set(languages.map(language => originalSection.content[language].applicationId)));
    return Promise.all(applicationIds.map(applicationId => this.h5pFileProcessor.uninstall(applicationId)));
  }
}

module.exports = H5pPlayer;
