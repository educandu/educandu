import { Docker } from 'docker-cli-js';
import { delay, isMac, noop } from './helpers.js';

const docker = new Docker({ echo: false });

export const DEFAULT_STARTUP_GRACE_PERIOD = isMac() ? 2500 : 1000;

export class DockerContainer {
  constructor({ name, image, portMappings = [], env = {}, onFirstRun = noop, startupGracePeriod = DEFAULT_STARTUP_GRACE_PERIOD }) {
    this.name = name;
    this.image = image;
    this.portMappings = portMappings;
    this.env = env;
    this.onFirstRun = onFirstRun;
    this.startupGracePeriod = startupGracePeriod;
  }

  async ensureIsRunning() {
    const container = await this._getContainer();
    if (!container) {
      await this.run();
    } else if (!container.status.startsWith('Up')) {
      await this.restart();
    }
  }

  async ensureIsRemoved() {
    if (await this._getContainer()) {
      await this.remove();
    }
  }

  async run() {
    let runArgs = `--name ${this.name} -d`;
    this.portMappings.forEach(portMapping => {
      runArgs += ` -p ${portMapping}`;
    });
    Object.entries(this.env).forEach(([key, value]) => {
      runArgs += ` -e ${key}="${value}"`;
    });
    runArgs += ` ${this.image}`;
    await docker.command(`run ${runArgs}`);
    await delay(this.startupGracePeriod);
    await this.onFirstRun();
  }

  async restart() {
    await docker.command(`restart ${this.name}`);
    await delay(this.startupGracePeriod);
  }

  async remove() {
    await docker.command(`rm -f ${this.name}`);
    await delay(1000);
  }

  async _getContainer() {
    const data = await docker.command('ps -a');
    return data.containerList.find(c => c.names === this.name);
  }
}
