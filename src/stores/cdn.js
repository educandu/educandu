import mime from 'mime';
import fs from 'node:fs';
import S3Client from './s3-client.js';
import Logger from '../common/logger.js';
import urlUtils from '../utils/url-utils.js';
import { getDisposalInfo, DISPOSAL_PRIORITY } from '../common/di.js';
import { DEFAULT_CONTENT_TYPE, STORAGE_DIRECTORY_MARKER_NAME } from '../domain/constants.js';

const logger = new Logger(import.meta.url);

class Cdn {
  constructor(s3Client, bucketName, region, rootUrl) {
    this.s3Client = s3Client;
    this.bucketName = bucketName;
    this.region = region;
    this.rootUrl = rootUrl;
  }

  uploadObject(objectPath, filePath) {
    const metadata = this._getDefaultMetadata();
    const stream = fs.createReadStream(filePath);
    const contentType = mime.getType(objectPath) || DEFAULT_CONTENT_TYPE;
    return this.s3Client.upload(this.bucketName, objectPath, stream, contentType, metadata);
  }

  async moveObject(oldObjectPath, newObjectPath) {
    const metadata = this._getDefaultMetadata();
    const contentType = mime.getType(newObjectPath) || DEFAULT_CONTENT_TYPE;
    await this.s3Client.copyObject(this.bucketName, oldObjectPath, newObjectPath, contentType, metadata);
    await this.s3Client.deleteObject(this.bucketName, oldObjectPath);
  }

  async deleteObject(objectPath) {
    await this.s3Client.deleteObject(this.bucketName, objectPath);
  }

  async ensureDirectory({ directoryPath }) {
    const metadata = this._getDefaultMetadata();
    const directoryMarkerPath = urlUtils.concatParts(directoryPath, STORAGE_DIRECTORY_MARKER_NAME);
    await this.s3Client.upload(this.bucketName, directoryMarkerPath, '', DEFAULT_CONTENT_TYPE, metadata);
  }

  async deleteDirectory({ directoryPath }) {
    const prefix = urlUtils.ensureTrailingSlash(directoryPath);
    const objects = await this.s3Client.listObjects(this.bucketName, prefix);
    await this.s3Client.deleteObjects(this.bucketName, objects.map(obj => obj.name));
  }

  [getDisposalInfo]() {
    return {
      priority: DISPOSAL_PRIORITY.storage,
      dispose: () => {
        logger.info('Closing CDN connection');
        this.s3Client = null;

        logger.info('CDN connection closed');

        return Promise.resolve();
      }
    };
  }

  _getDefaultMetadata() {
    return { createdon: new Date().toISOString() };
  }

  static create({ endpoint, region, accessKey, secretKey, bucketName, rootUrl }) {
    const s3Client = new S3Client({ endpoint, region, accessKey, secretKey });
    return Promise.resolve(new Cdn(s3Client, bucketName, region, rootUrl));
  }
}

export default Cdn;
