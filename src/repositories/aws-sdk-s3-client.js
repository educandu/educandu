import { EOL } from 'os';
import awsSdk from 'aws-sdk';
import PriorityQueue from '../common/priority-queue.js';
import { splitIntoChunks } from '../utils/array-utils.js';

const { S3, Credentials } = awsSdk;

const MAX_REQUESTS = 250;
const PRIORITY_UPLOAD = 2;
const PRIORITY_DOWNLOAD = 1;
const PRIORITY_ADMINISTRATIVE = 0;

function unescapeEtag(etag) {
  return etag
    .replace(/^"/g, '')
    .replace(/"$/g, '')
    .replace(/^&quot;/g, '')
    .replace(/&quot;$/g, '')
    .replace(/^&#34;/g, '')
    .replace(/^&#34;$/g, '');
}

// Wraps AWS S3 client into a promise-friendly interface,
// also limits concurrent requests using a priority queue.
class AwsSdkS3Client {
  constructor({ endpoint, region, accessKey, secretKey }) {
    this.tasks = new PriorityQueue(MAX_REQUESTS);
    this.awsSdkS3Client = new S3({
      apiVersion: '2006-03-01',
      endpoint,
      region,
      credentials: new Credentials(accessKey, secretKey)
    });
  }

  req(createRequest, priority) {
    return this.tasks.push(cb => createRequest().send(cb), priority);
  }

  async createBucket(bucketName, region) {
    const params = {
      Bucket: bucketName,
      CreateBucketConfiguration: {
        LocationConstraint: region
      }
    };

    await this.req(() => this.awsSdkS3Client.createBucket(params), PRIORITY_ADMINISTRATIVE);
  }

  async putBucketPolicy(bucketName, bucketPolicy) {
    const params = {
      Bucket: bucketName,
      Policy: bucketPolicy
    };

    await this.req(() => this.awsSdkS3Client.putBucketPolicy(params), PRIORITY_ADMINISTRATIVE);
  }

  async listBuckets() {
    const params = {};
    const data = await this.req(() => this.awsSdkS3Client.listBuckets(params), PRIORITY_ADMINISTRATIVE);
    return data.Buckets.map(b => ({
      name: b.Name,
      creationDate: b.CreationDate
    }));
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

      /* eslint-disable-next-line no-await-in-loop, no-loop-func */
      const response = await this.req(() => this.awsSdkS3Client.listObjects({ ...params, Marker: marker }), PRIORITY_DOWNLOAD);

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
      etag: unescapeEtag(obj.ETag),
      size: obj.Size
    }));

    const transformedCommonPrefixes = Array.from(commonPrefixes).map(pre => ({
      prefix: pre,
      size: 0
    }));

    return transformedObjects.concat(transformedCommonPrefixes);
  }

  async getObject(bucketName, objectName) {
    const params = {
      Bucket: bucketName,
      Key: objectName
    };

    const response = await this.req(() => this.awsSdkS3Client.getObject(params), PRIORITY_DOWNLOAD);
    return response.Body;
  }

  async objectExists(bucketName, objectName) {
    const params = {
      Bucket: bucketName,
      Key: objectName
    };

    try {
      await this.req(() => this.awsSdkS3Client.headObject(params), PRIORITY_DOWNLOAD);
      return true;
    } catch (error) {
      if (error?.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  async deleteObject(bucketName, objectName) {
    const params = {
      Bucket: bucketName,
      Key: objectName
    };

    await this.req(() => this.awsSdkS3Client.deleteObject(params), PRIORITY_ADMINISTRATIVE);
  }

  async deleteObjects(bucketName, objectNames) {
    const maxItems = 1000;
    const listsOfNames = splitIntoChunks(objectNames, maxItems);

    const requests = listsOfNames.map(chunk => {
      const params = {
        Bucket: bucketName,
        Delete: {
          Objects: chunk.map(obj => ({ Key: obj }))
        }
      };

      return this.req(() => this.awsSdkS3Client.deleteObjects(params), PRIORITY_ADMINISTRATIVE);
    });

    const results = await Promise.all(requests);
    const errors = results.reduce((all, res) => all.concat(res.Errors || []), []);
    if (errors.length) {
      throw new Error(['CDN Error. Could not delete following objects:', ...errors.map(err => err.Key)].join(EOL));
    }
  }

  async upload(bucketName, objectName, stream, contentType, metadata = {}) {
    const params = {
      Bucket: bucketName,
      Key: objectName,
      Body: stream,
      ContentType: contentType,
      Metadata: metadata
    };

    const options = {
      partSize: 10 * 1024 * 1024,
      queueSize: 1
    };

    const data = await this.req(() => this.awsSdkS3Client.upload(params, options), PRIORITY_UPLOAD);
    return {
      name: data.Key,
      etag: unescapeEtag(data.ETag)
    };
  }

  async deleteBucket(bucketName) {
    const params = {
      Bucket: bucketName
    };

    await this.req(() => this.awsSdkS3Client.deleteBucket(params), PRIORITY_ADMINISTRATIVE);
  }
}

export default AwsSdkS3Client;
