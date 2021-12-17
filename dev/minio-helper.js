/* eslint-disable no-await-in-loop, no-console */

import { Client } from 'minio';
import { delay } from './helpers.js';

const bucketMaxCreationAttemptCount = 3;

export async function ensureMinioBucketExists({
  bucketName,
  endPoint,
  port,
  useSSL,
  region,
  accessKey,
  secretKey
}) {
  const bucketPolicy = {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'PublicReadGetObject',
        Effect: 'Allow',
        Principal: '*',
        Action: 's3:GetObject',
        Resource: `arn:aws:s3:::${bucketName}/*`
      }
    ]
  };

  let error = null;
  let bucketCreationAttempt = 0;

  do {

    try {
      bucketCreationAttempt += 1;

      const minioClient = new Client({ endPoint, port, useSSL, region, accessKey, secretKey });
      const buckets = await minioClient.listBuckets();

      if (!buckets.find(x => x.name === bucketName)) {
        await minioClient.makeBucket(bucketName, region);
        await minioClient.setBucketPolicy(bucketName, JSON.stringify(bucketPolicy));
      }
    } catch (err) {
      console.log(`Attempt ${bucketCreationAttempt} to create minio bucket failed`);

      error = err;
      await delay(bucketCreationAttempt * 1000);
    }

  } while (error && bucketCreationAttempt < bucketMaxCreationAttemptCount);

  if (error) {
    throw error;
  }
}
