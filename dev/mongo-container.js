import { noop } from './helpers.js';
import { DEFAULT_STARTUP_GRACE_PERIOD, DockerContainer } from './docker-container.js';

const DEFAULT_MONGO_CONTAINER_NAME = 'mongo';
const DEFAULT_MONGO_IMAGE = 'bitnami/mongodb:4.2.17-debian-10-r23';

export class MongoContainer extends DockerContainer {
  constructor({
    rootUser,
    rootPassword,
    replicaSetName,
    replicaSetMode = 'primary',
    advertisedHostname = 'localhost',
    port = 27017,
    name = DEFAULT_MONGO_CONTAINER_NAME,
    image = DEFAULT_MONGO_IMAGE,
    env = {},
    onFirstRun = noop,
    startupGracePeriod = DEFAULT_STARTUP_GRACE_PERIOD
  }) {
    const replicaSetEnvParams = replicaSetName
      ? {
        MONGODB_REPLICA_SET_KEY: replicaSetName,
        MONGODB_REPLICA_SET_NAME: replicaSetName,
        MONGODB_REPLICA_SET_MODE: replicaSetMode
      }
      : {};

    super({
      name,
      image,
      startupGracePeriod,
      portMappings: [`${port}:27017`],
      env: {
        MONGODB_ROOT_USER: rootUser,
        MONGODB_ROOT_PASSWORD: rootPassword,
        MONGODB_ADVERTISED_HOSTNAME: advertisedHostname,
        ...replicaSetEnvParams,
        ...env
      },
      onFirstRun
    });
  }
}
