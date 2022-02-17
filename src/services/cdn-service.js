import urls from '../utils/urls.js';
import Cdn from '../repositories/cdn.js';
import fileNameHelper from '../utils/file-name-helper.js';

export default class CdnService {
  static get inject() { return [Cdn]; }

  constructor(cdn) {
    this.cdn = cdn;
  }

  async uploadFiles({ prefix, files }) {
    const uploads = files.map(async file => {
      const cdnFileName = fileNameHelper.buildCdnFileName(file.originalname, prefix);
      await this.cdn.uploadObject(cdnFileName, file.path, {});
    });
    await Promise.all(uploads);
  }

  async listObjects({ prefix, recursive }) {
    const objects = await this.cdn.listObjects({ prefix, recursive });
    return objects;
  }

  async deleteObject({ prefix, objectName }) {
    await this.cdn.deleteObject(urls.concatParts(prefix, objectName));
  }
}
