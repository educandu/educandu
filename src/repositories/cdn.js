const { Client } = require('minio');

class Cdn {
  constructor(minioClient, bucketName, region) {
    this._minioClient = minioClient;
    this._bucketName = bucketName;
    this._region = region;
  }

  dispose() {
    this._minioClient = null;
    return Promise.resolve();
  }

  static create({ endPoint, port, secure, region, accessKey, secretKey, bucketName }) {
    const minioClient = new Client({ endPoint, port, secure, region, accessKey, secretKey });
    return Promise.resolve(new Cdn(minioClient, bucketName, region));
  }
}

module.exports = Cdn;
