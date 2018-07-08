const fs = require('fs');
const mime = require('mime');
const Stream = require('stream');
const MinioS3Client = require('./minio-s3-client');
const AwsSdkS3Client = require('./aws-sdk-s3-client');

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
    const stream = fs.createReadStream(filePath);
    const sanitizedObjectName = objectName.replace(/\\/g, '/');
    const contentType = mime.getType(filePath) || defaultContentType;
    return this.s3Client.upload(this.bucketName, sanitizedObjectName, stream, contentType, metadata);
  }

  uploadEmptyObject(objectName, metadata) {
    const sanitizedObjectName = objectName.replace(/\\/g, '/');
    return this.s3Client.upload(this.bucketName, sanitizedObjectName, new Stream(), defaultContentType, metadata);
  }

  dispose() {
    this.s3Client = null;
    return Promise.resolve();
  }

  static create({ endpoint, region, accessKey, secretKey, bucketName, rootUrl }) {
    const s3Client = endpoint.includes('.amazonaws.com')
      ? new AwsSdkS3Client({ endpoint, region, accessKey, secretKey })
      : new MinioS3Client({ endpoint, region, accessKey, secretKey });

    return Promise.resolve(new Cdn(s3Client, bucketName, region, rootUrl));
  }
}

module.exports = Cdn;
