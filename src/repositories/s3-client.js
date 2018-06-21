const { Client } = require('minio');

// Wraps Minio client into a promise-friendly interface
class S3Client {
  constructor({ endPoint, port, secure, region, accessKey, secretKey }) {
    this._minioClient = new Client({ endPoint, port, secure, region, accessKey, secretKey });
  }

  makeBucket(bucketName, region) {
    return this._minioClient.makeBucket(bucketName, region);
  }

  setBucketPolicy(bucketName, bucketPolicy) {
    return this._minioClient.setBucketPolicy(bucketName, bucketPolicy);
  }

  listBuckets() {
    return this._minioClient.listBuckets();
  }

  listObjects(bucketName, prefix, recursive) {
    return new Promise((resolve, reject) => {
      const objects = [];
      const objectStream = this._minioClient.listObjects(bucketName, prefix, recursive);
      objectStream.on('data', obj => objects.push(obj));
      objectStream.on('error', err => reject(err));
      objectStream.on('end', () => resolve(objects));
    });
  }

  // Docs say `objects` should be a 'list' of objects,
  // but it only works with a string array of object names!
  removeObjects(bucketName, objects) {
    return new Promise((resolve, reject) => {
      this._minioClient.removeObjects(bucketName, objects, err => err ? reject(err) : resolve());
    });
  }

  fPutObject(bucketName, objectName, filePath, metaData) {
    return this._minioClient.fPutObject(bucketName, objectName, filePath, metaData);
  }

  putObject(bucketName, objectName, stream, size, metaData) {
    return this._minioClient.putObject(bucketName, objectName, stream, size, metaData);
  }

  removeBucket(bucketName) {
    return this._minioClient.removeBucket(bucketName);
  }
}

module.exports = S3Client;
