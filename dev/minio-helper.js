import { Client } from 'minio';

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

  const minioClient = new Client({ endPoint, port, useSSL, region, accessKey, secretKey });

  const buckets = await minioClient.listBuckets();

  if (!buckets.find(x => x.name === bucketName)) {
    await minioClient.makeBucket(bucketName, region);
    await minioClient.setBucketPolicy(bucketName, JSON.stringify(bucketPolicy));
  }
}
