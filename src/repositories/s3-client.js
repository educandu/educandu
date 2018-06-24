const { Client } = require('minio');
const streamToArray = require('stream-to-array');
const PriorityQueue = require('../common/priority-queue');

const PRIORITY_UPLOAD = 2;
const PRIORITY_DOWNLOAD = 1;
const PRIORITY_ADMINISTRATIVE = 0;
const CDN_CLIENT_MAX_REQUESTS = 250;

// Wraps Minio client into a promise-friendly interface,
// also limits concurrent requests using a priority queue.
class S3Client {
  constructor({ endPoint, port, secure, region, accessKey, secretKey }) {
    this._tasks = new PriorityQueue(CDN_CLIENT_MAX_REQUESTS);
    this._minioClient = new Client({ endPoint, port, secure, region, accessKey, secretKey });
  }

  makeBucket(bucketName, region) {
    return this._tasks.push(cb => this._minioClient.makeBucket(bucketName, region, cb), PRIORITY_ADMINISTRATIVE);
  }

  setBucketPolicy(bucketName, bucketPolicy) {
    return this._tasks.push(cb => this._minioClient.setBucketPolicy(bucketName, bucketPolicy, cb), PRIORITY_ADMINISTRATIVE);
  }

  listBuckets() {
    return this._tasks.push(cb => this._minioClient.listBuckets(cb), PRIORITY_DOWNLOAD);
  }

  listObjects(bucketName, prefix, recursive) {
    return this._tasks.push(cb => streamToArray(this._minioClient.listObjects(bucketName, prefix, recursive), cb), PRIORITY_DOWNLOAD);
  }

  getObject(bucketName, objectName) {
    return this._tasks.push(cb => this._minioClient.getObject(bucketName, objectName, cb), PRIORITY_DOWNLOAD);
  }

  // Docs say `objects` should be a 'list' of objects,
  // but it only works with a string array of object names!
  removeObjects(bucketName, objects) {
    return this._tasks.push(cb => this._minioClient.removeObjects(bucketName, objects, cb), PRIORITY_UPLOAD);
  }

  fPutObject(bucketName, objectName, filePath, metaData) {
    return this._tasks.push(cb => this._minioClient.fPutObject(bucketName, objectName, filePath, metaData, cb), PRIORITY_UPLOAD);
  }

  putObject(bucketName, objectName, stream, size, metaData) {
    return this._tasks.push(cb => this._minioClient.putObject(bucketName, objectName, stream, size, metaData, cb), PRIORITY_UPLOAD);
  }

  removeBucket(bucketName) {
    return this._tasks.push(cb => this._minioClient.removeBucket(bucketName, cb), PRIORITY_ADMINISTRATIVE);
  }
}

module.exports = S3Client;
