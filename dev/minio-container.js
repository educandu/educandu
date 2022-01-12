import { noop } from './helpers.js';
import { ensureMinioBucketExists } from './minio-helper.js';
import { DEFAULT_STARTUP_GRACE_PERIOD, DockerContainer } from './docker-container.js';

const DEFAULT_MINIO_CONTAINER_NAME = 'minio';
const DEFAULT_MINIO_IMAGE = 'bitnami/minio:2020.12.18';

export class MinioContainer extends DockerContainer {
  constructor({
    accessKey,
    secretKey,
    endPoint = 'localhost',
    port = 9000,
    useSSL = false,
    region = 'eu-central-1',
    initialBuckets = [],
    name = DEFAULT_MINIO_CONTAINER_NAME,
    image = DEFAULT_MINIO_IMAGE,
    env = {},
    netHost = false,
    cmd = [],
    onFirstRun = noop,
    startupGracePeriod = DEFAULT_STARTUP_GRACE_PERIOD
  }) {
    super({
      name,
      image,
      startupGracePeriod,
      portMappings: [`${port}:9000`],
      env: {
        MINIO_ACCESS_KEY: accessKey,
        MINIO_SECRET_KEY: secretKey,
        MINIO_DOMAIN: endPoint,
        MINIO_BROWSER: 'on',
        ...env
      },
      netHost,
      cmd,
      onFirstRun: () => Promise.all([
        ...initialBuckets.map(bucketName => ensureMinioBucketExists({
          bucketName,
          endPoint,
          port,
          useSSL,
          region,
          accessKey,
          secretKey
        })),
        onFirstRun
      ])
    });
  }
}
