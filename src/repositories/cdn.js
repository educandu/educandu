import by from 'thenby';
import mime from 'mime';
import fs from 'node:fs';
import Logger from '../common/logger.js';
import urlUtils from '../utils/url-utils.js';
import MinioS3Client from './minio-s3-client.js';
import AwsSdkS3Client from './aws-sdk-s3-client.js';
import { ensureIsUnique } from '../utils/array-utils.js';
import { getDisposalInfo, DISPOSAL_PRIORITY } from '../common/di.js';
import { CDN_URL_PREFIX, DEFAULT_CONTENT_TYPE, STORAGE_DIRECTORY_MARKER_NAME } from '../domain/constants.js';

const logger = new Logger(import.meta.url);

class Cdn {
  constructor(s3Client, bucketName, region, rootUrl) {
    this.s3Client = s3Client;
    this.bucketName = bucketName;
    this.region = region;
    this.rootUrl = rootUrl;
  }

  async listObjects({ directoryPath }) {
    const prefix = urlUtils.ensureTrailingSlash(directoryPath);
    const objects = await this.s3Client.listObjects(this.bucketName, prefix, false);

    const mappedObjects = ensureIsUnique(
      objects
        .map(obj => {
          const path = obj.name || '';
          const objectSegments = path.split('/').filter(seg => !!seg);
          const lastSegment = objectSegments[objectSegments.length - 1];
          const encodedObjectSegments = objectSegments.map(s => encodeURIComponent(s));

          if (lastSegment === STORAGE_DIRECTORY_MARKER_NAME) {
            return null;
          }

          return {
            name: lastSegment,
            parentPath: objectSegments.slice(0, -1).join('/'),
            path: objectSegments.join('/'),
            url: [this.rootUrl, ...encodedObjectSegments].join('/'),
            portableUrl: `${CDN_URL_PREFIX}${encodedObjectSegments.join('/')}`,
            createdOn: obj.lastModified,
            updatedOn: obj.lastModified,
            size: obj.size
          };
        })
        .filter(obj => obj),
      obj => obj.path
    );

    return mappedObjects.sort(by(obj => obj.path));
  }

  uploadObject(objectPath, filePath) {
    const metadata = this._getDefaultMetadata();
    const stream = fs.createReadStream(filePath);
    const sanitizedObjectName = objectPath.replace(/\\/g, '/');
    const contentType = mime.getType(sanitizedObjectName) || DEFAULT_CONTENT_TYPE;
    return this.s3Client.upload(this.bucketName, sanitizedObjectName, stream, contentType, metadata);
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
    const objects = await this.s3Client.listObjects(this.bucketName, prefix, true);
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
    const s3Client = endpoint.includes('.amazonaws.com')
      ? new AwsSdkS3Client({ endpoint, region, accessKey, secretKey })
      : new MinioS3Client({ endpoint, region, accessKey, secretKey });

    return Promise.resolve(new Cdn(s3Client, bucketName, region, rootUrl));
  }
}

export default Cdn;
