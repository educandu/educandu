import { URL } from 'url';
import { Client } from 'minio';
import readAllStream from 'read-all-stream';
import streamToArray from 'stream-to-array';
import PriorityQueue from '../common/priority-queue.js';

const MAX_REQUESTS = 100;
const PRIORITY_UPLOAD = 2;
const PRIORITY_DOWNLOAD = 1;
const PRIORITY_ADMINISTRATIVE = 0;

// Wraps Minio client into a promise-friendly interface,
// also limits concurrent requests using a priority queue.
class MinioS3Client {
  constructor({ endpoint, region, accessKey, secretKey }) {
    const endpointUrl = new URL(endpoint);
    this.tasks = new PriorityQueue(MAX_REQUESTS);
    this.minioClient = new Client({
      endPoint: endpointUrl.hostname,
      port: Number(endpointUrl.port) || 0,
      useSSL: endpointUrl.protocol === 'https:',
      region,
      accessKey,
      secretKey
    });
  }

  async createBucket(bucketName, region) {
    await this.tasks.push(cb => this.minioClient.makeBucket(bucketName, region, cb), PRIORITY_ADMINISTRATIVE);
  }

  async putBucketPolicy(bucketName, bucketPolicy) {
    await this.tasks.push(cb => this.minioClient.setBucketPolicy(bucketName, bucketPolicy, cb), PRIORITY_ADMINISTRATIVE);
  }

  async listBuckets() {
    const data = await this.tasks.push(cb => this.minioClient.listBuckets(cb), PRIORITY_DOWNLOAD);
    return data.map(b => ({
      name: b.name,
      creationDate: b.creationDate
    }));
  }

  async listObjects(bucketName, prefix, recursive) {
    const objects = await this.tasks.push(cb => streamToArray(this.minioClient.listObjects(bucketName, prefix, recursive), cb), PRIORITY_DOWNLOAD);
    return objects.map(obj => {
      return obj.name
        ? { name: obj.name, lastModified: new Date(obj.lastModified), etag: obj.etag, size: obj.size }
        : { prefix: obj.prefix, size: 0 };
    });
  }

  async getObject(bucketName, objectName) {
    const stream = await this.tasks.push(cb => this.minioClient.getObject(bucketName, objectName, cb), PRIORITY_DOWNLOAD);
    return readAllStream(stream);
  }

  async objectExists(bucketName, objectName) {
    try {
      await this.tasks.push(cb => this.minioClient.statObject(bucketName, objectName, cb), PRIORITY_DOWNLOAD);
      return true;
    } catch (error) {
      if (error.code === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  async deleteObject(bucketName, objectName) {
    await this.tasks.push(cb => this.minioClient.removeObject(bucketName, objectName, cb), PRIORITY_UPLOAD);
  }

  async deleteObjects(bucketName, objectNames) {
    await this.tasks.push(cb => this.minioClient.removeObjects(bucketName, objectNames, cb), PRIORITY_UPLOAD);
  }

  async upload(bucketName, objectName, body, contentType, metadata = {}) {
    const etag = await this.tasks.push(cb => this.minioClient.putObject(bucketName, objectName, body, null, { ...metadata, 'Content-Type': contentType }, cb), PRIORITY_UPLOAD);
    return {
      name: objectName,
      etag
    };
  }

  async deleteBucket(bucketName) {
    await this.tasks.push(cb => this.minioClient.removeBucket(bucketName, cb), PRIORITY_ADMINISTRATIVE);
  }
}

export default MinioS3Client;
