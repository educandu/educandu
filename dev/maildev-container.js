import { noop } from './helpers.js';
import { DEFAULT_STARTUP_GRACE_PERIOD, DockerContainer } from './docker-container.js';

const DEFAULT_MAILDEV_CONTAINER_NAME = 'maildev';
const DEFAULT_MAILDEV_IMAGE = 'maildev/maildev:1.1.0';

export class MaildevContainer extends DockerContainer {
  constructor({
    smtpPort = 8025,
    frontendPort = 8000,
    name = DEFAULT_MAILDEV_CONTAINER_NAME,
    image = DEFAULT_MAILDEV_IMAGE,
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
      portMappings: [`${smtpPort}:25`, `${frontendPort}:80`],
      env,
      netHost,
      cmd,
      onFirstRun
    });
  }
}
