import fs from 'fs';
import mime from 'mime';
import Stream from 'stream';
import superagent from 'superagent';
import Logger from '../common/logger.js';
import MinioS3Client from './minio-s3-client.js';
import AwsSdkS3Client from './aws-sdk-s3-client.js';
import { getDisposalInfo, DISPOSAL_PRIORITY } from '../common/di.js';

const logger = new Logger(import.meta.url);

const defaultContentType = 'application/octet-stream';

// Wraps access to a specific bucket using S3 client
class Cdn {
  constructor(s3Client, bucketName, region, rootUrl) {
    this.s3Client = s3Client;
    this.bucketName = bucketName;
    this.region = region;
    this.rootUrl = rootUrl;
  }

  listObjects({ prefix = '', recursive = false } = {}) {
    return this.s3Client.listObjects(this.bucketName, prefix, recursive);
  }

  getObjectAsBuffer(objectName) {
    return this.s3Client.getObject(this.bucketName, objectName);
  }

  async getObjectAsString(objectName, encoding = 'utf8') {
    const buffer = await this.getObjectAsBuffer(objectName);
    return buffer.toString(encoding);
  }

  uploadObject(objectName, filePath, metadata) {
    const defaultMetadata = this._getDefaultMetadata();
    const stream = fs.createReadStream(filePath);
    const sanitizedObjectName = objectName.replace(/\\/g, '/');
    const contentType = mime.getType(sanitizedObjectName) || defaultContentType;
    return this.s3Client.upload(this.bucketName, sanitizedObjectName, stream, contentType, { ...defaultMetadata, ...metadata });
  }

  async uploadObjectFromUrl(objectName, url) {
    const body = await superagent.get(url).then(res => res.body);
    const contentType = mime.getType(objectName) || defaultContentType;
    return this.s3Client.upload(this.bucketName, objectName, body, contentType);
  }

  uploadEmptyObject(objectName, metadata) {
    const defaultMetadata = this._getDefaultMetadata();
    const sanitizedObjectName = objectName.replace(/\\/g, '/');
    return this.s3Client.upload(this.bucketName, sanitizedObjectName, new Stream(), defaultContentType, { ...defaultMetadata, ...metadata });
  }

  async deleteObjects(objectNames) {
    await this.s3Client.deleteObjects(this.bucketName, objectNames);
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
    const s3Client = endpoint.includes('.amazonaws.com')
      ? new AwsSdkS3Client({ endpoint, region, accessKey, secretKey })
      : new MinioS3Client({ endpoint, region, accessKey, secretKey });

    return Promise.resolve(new Cdn(s3Client, bucketName, region, rootUrl));
  }
}

export default Cdn;
