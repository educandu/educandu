import PQueue from 'p-queue';
import { EOL } from 'node:os';
import { S3 } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { ensureIsUnique, splitIntoChunks } from '../utils/array-utils.js';

const MAX_CONCURRENCY = 250;
const HTTP_STATUS_PRECONDITION_FAILED = 412;

// Wraps an AWS S3 client limiting concurrency.
// Assumes usage of MinIO in case the endpoint is not on AWS.
class S3Client {
  constructor({ endpoint, region, accessKey, secretKey }) {
    const credentials = {
      accessKeyId: accessKey,
      secretAccessKey: secretKey
    };

    this.queue = new PQueue({ concurrency: MAX_CONCURRENCY });
    this.client = endpoint.includes('amazonaws')
      ? new S3({
        apiVersion: '2006-03-01',
        endpoint,
        region,
        credentials
      })
      : new S3({
        endpoint,
        region,
        credentials,
        forcePathStyle: true,
        signatureVersion: 'v4'
      });
  }

  async createBucket(bucketName, region) {
    await this.queue.add(() => this.client.createBucket({
      Bucket: bucketName,
      CreateBucketConfiguration: {
        LocationConstraint: region
      }
    }));
  }

  async putBucketPolicy(bucketName, bucketPolicy) {
    await this.queue.add(() => this.client.putBucketPolicy({
      Bucket: bucketName,
      Policy: bucketPolicy
    }));
  }

  async listObjects(bucketName, prefix) {
    const objects = [];
    let continuationToken = null;

    do {
      // eslint-disable-next-line no-loop-func
      const response = await this.queue.add(() => this.client.listObjectsV2({
        Bucket: bucketName,
        Prefix: prefix,
        MaxKeys: 1000,
        ContinuationToken: continuationToken,
      }));

      const newObjects = response.Contents || [];
      objects.push(...newObjects);
      continuationToken = response.IsTruncated ? response.NextContinuationToken : null;

    } while (continuationToken);

    const transformedObjects = objects.map(obj => ({
      name: obj.Key,
      lastModified: new Date(obj.LastModified),
      size: obj.Size
    }));

    return ensureIsUnique(transformedObjects, item => item.name);
  }

  async deleteObject(bucketName, objectName) {
    await this.queue.add(() => this.client.deleteObject({
      Bucket: bucketName,
      Key: objectName
    }));
  }

  async deleteObjects(bucketName, objectNames) {
    const maxItems = 1000;
    const objectNamesChunks = splitIntoChunks(objectNames, maxItems);

    const requests = objectNamesChunks.map(chunk => {
      return this.queue.add(() => this.client.deleteObjects({
        Bucket: bucketName,
        Delete: {
          Objects: chunk.map(obj => ({ Key: obj }))
        }
      }));
    });

    const results = await Promise.all(requests);
    const errors = results.flatMap(res => res.Errors || []);
    if (errors.length) {
      throw new Error(['CDN Error. Could not delete following objects:', ...errors.map(err => err.Key)].join(EOL));
    }
  }

  async copyObject(bucketName, oldObjectName, newObjectName, contentType, metadata = {}) {
    await this.queue.add(() => this.client.copyObject({
      Bucket: bucketName,
      Key: newObjectName,
      CopySource: `${bucketName}/${oldObjectName}`,
      ContentType: contentType,
      Metadata: metadata
    }));
  }

  async upload(bucketName, objectName, body, contentType, metadata = {}, preventOverride = false) {
    const data = await this.queue.add(async () => {
      try {
        const result = await new Upload({
          client: this.client,
          params: {
            Bucket: bucketName,
            Key: objectName,
            Body: body,
            ContentType: contentType,
            Metadata: metadata,
            IfNoneMatch: preventOverride ? '*' : null
          },
          queueSize: 1,
          partSize: 10 * 1024 * 1024,
          leavePartsOnError: false
        }).done();

        return result;
      } catch (error) {
        const overridePrevented = preventOverride && error.$metadata.httpStatusCode === HTTP_STATUS_PRECONDITION_FAILED;
        if (overridePrevented) {
          return null;
        }
        throw error;
      }
    });

    return {
      name: data?.Key || objectName
    };
  }

  async deleteBucket(bucketName) {
    await this.queue.add(() => this.client.deleteBucket({
      Bucket: bucketName
    }));
  }
}

export default S3Client;
