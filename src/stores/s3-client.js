import awsSdk from 'aws-sdk';
import { EOL } from 'node:os';
import { priorityQueue } from 'async';
import { splitIntoChunks } from '../utils/array-utils.js';

const { S3, Credentials } = awsSdk;

const MAX_REQUESTS = 250;
const PRIORITY_LOW = 1;
const PRIORITY_HIGH = 0;

// Wraps AWS S3 client into a promise-friendly interface,
// also limits concurrent requests using a priority queue.
// Potentially longer-running tasks have a lower priority.
// Works with AWS S3 as well as MinIO S3-compatible storage.
class S3Client {
  constructor({ endpoint, region, accessKey, secretKey }) {
    this.queue = priorityQueue(this._runTask, MAX_REQUESTS);
    this.client = endpoint.includes('amazonaws')
      ? new S3({
        apiVersion: '2006-03-01',
        endpoint,
        region,
        credentials: new Credentials(accessKey, secretKey)
      })
      : new S3({
        endpoint,
        credentials: new Credentials(accessKey, secretKey),
        s3ForcePathStyle: true,
        signatureVersion: 'v4'
      });
  }

  async createBucket(bucketName, region) {
    const params = {
      Bucket: bucketName,
      CreateBucketConfiguration: {
        LocationConstraint: region
      }
    };

    await this._pushTask(() => this.client.createBucket(params), PRIORITY_HIGH);
  }

  async putBucketPolicy(bucketName, bucketPolicy) {
    const params = {
      Bucket: bucketName,
      Policy: bucketPolicy
    };

    await this._pushTask(() => this.client.putBucketPolicy(params), PRIORITY_HIGH);
  }

  async listObjects(bucketName, prefix, recursive) {
    const params = {
      Bucket: bucketName,
      Delimiter: recursive ? '' : '/',
      Prefix: prefix,
      MaxKeys: 1000
    };

    let marker = '';
    let objects = [];
    const commonPrefixes = new Set();

    do {
      // eslint-disable-next-line no-loop-func
      const response = await this._pushTask(() => this.client.listObjects({ ...params, Marker: marker }), PRIORITY_HIGH);

      const keys = params.Delimiter
        ? (response.CommonPrefixes || []).map(pre => pre.Prefix)
        : (response.Contents || []).map(obj => obj.Key);

      if (response.IsTruncated) {
        marker = params.Delimiter ? response.NextMarker : keys[keys.length - 1];
      } else {
        marker = '';
      }

      objects = [...objects, ...response.Contents];
      (response.CommonPrefixes || []).forEach(pre => commonPrefixes.add(pre.Prefix));

    } while (marker);

    const transformedObjects = objects.map(obj => ({
      name: obj.Key,
      lastModified: new Date(obj.LastModified),
      size: obj.Size
    }));

    const transformedCommonPrefixes = Array.from(commonPrefixes).map(pre => ({
      prefix: pre,
      size: 0
    }));

    return transformedObjects.concat(transformedCommonPrefixes);
  }

  async deleteObject(bucketName, objectName) {
    const params = {
      Bucket: bucketName,
      Key: objectName
    };

    await this._pushTask(() => this.client.deleteObject(params), PRIORITY_HIGH);
  }

  async deleteObjects(bucketName, objectNames) {
    const maxItems = 1000;
    const objectNamesChunks = splitIntoChunks(objectNames, maxItems);

    const requests = objectNamesChunks.map(chunk => {
      const params = {
        Bucket: bucketName,
        Delete: {
          Objects: chunk.map(obj => ({ Key: obj }))
        }
      };

      return this._pushTask(() => this.client.deleteObjects(params), PRIORITY_HIGH);
    });

    const results = await Promise.all(requests);
    const errors = results.reduce((all, res) => all.concat(res.Errors || []), []);
    if (errors.length) {
      throw new Error(['CDN Error. Could not delete following objects:', ...errors.map(err => err.Key)].join(EOL));
    }
  }

  async copyObject(bucketName, oldObjectName, newObjectName, contentType, metadata = {}) {
    const params = {
      Bucket: bucketName,
      Key: newObjectName,
      CopySource: `${bucketName}/${oldObjectName}`,
      ContentType: contentType,
      Metadata: metadata
    };

    await this._pushTask(() => this.client.copyObject(params), PRIORITY_LOW);
  }

  async upload(bucketName, objectName, body, contentType, metadata = {}) {
    const params = {
      Bucket: bucketName,
      Key: objectName,
      Body: body,
      ContentType: contentType,
      Metadata: metadata
    };

    const options = {
      partSize: 10 * 1024 * 1024,
      queueSize: 1
    };

    const data = await this._pushTask(() => this.client.upload(params, options), PRIORITY_LOW);
    return {
      name: data.Key
    };
  }

  async deleteBucket(bucketName) {
    const params = {
      Bucket: bucketName
    };

    await this._pushTask(() => this.client.deleteBucket(params), PRIORITY_HIGH);
  }

  _pushTask(createRequest, priority) {
    const func = cb => createRequest().send(cb);
    return new Promise((resolve, reject) => {
      this.queue.push({ func, reject, resolve }, priority);
    });
  }

  _runTask(task, callback) {
    try {
      task.func((err, result) => {
        if (err) {
          task.reject(err);
        } else {
          task.resolve(result);
        }
        callback(err);
      });
    } catch (error) {
      task.reject(error);
    }
  }
}

export default S3Client;
