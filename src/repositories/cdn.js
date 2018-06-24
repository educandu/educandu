const Stream = require('stream');
const S3Client = require('./s3-client');
const readAllStream = require('read-all-stream');

// Wraps access to a specific bucket using S3 client
class Cdn {
  constructor(s3Client, bucketName, region) {
    this._s3Client = s3Client;
    this._bucketName = bucketName;
    this._region = region;
  }

  listObjects({ prefix = '', recursive = false } = {}) {
    return this._s3Client.listObjects(this._bucketName, prefix, recursive);
  }

  getObject(objectName) {
    return this._s3Client.getObject(this._bucketName, objectName);
  }

  async getObjectAsBuffer(objectName) {
    const stream = await this.getObject(objectName);
    return readAllStream(stream);
  }

  async getObjectAsString(objectName, encoding) {
    const stream = await this.getObject(objectName);
    return readAllStream(stream, encoding || 'utf8');
  }

  deleteObjects(objectNames) {
    return this._s3Client.removeObjects(this._bucketName, objectNames);
  }

  async uploadObject(objectName, filePath, metaData) {
    const etag = await this._s3Client.fPutObject(this._bucketName, objectName, filePath, metaData);
    return { etag };
  }

  async uploadEmptyObject(objectName, metaData) {
    const etag = await this._s3Client.putObject(this._bucketName, objectName, new Stream(), 0, metaData);
    return { etag };
  }

  dispose() {
    this._s3Client = null;
    return Promise.resolve();
  }

  static create({ endPoint, port, secure, region, accessKey, secretKey, bucketName }) {
    const s3Client = new S3Client({ endPoint, port, secure, region, accessKey, secretKey });
    return Promise.resolve(new Cdn(s3Client, bucketName, region));
  }
}

module.exports = Cdn;
