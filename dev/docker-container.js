import { Docker } from 'docker-cli-js';
import { delay, isMac, noop } from './helpers.js';

const docker = new Docker({ echo: false });

export const DEFAULT_STARTUP_GRACE_PERIOD = isMac() ? 2500 : 1000;

export class DockerContainer {
  constructor({ name, image, portMappings = [], env = {}, netHost = false, cmd = [], onFirstRun = noop, startupGracePeriod = DEFAULT_STARTUP_GRACE_PERIOD }) {
    this.name = name;
    this.image = image;
    this.portMappings = portMappings;
    this.env = env;
    this.netHost = netHost;
    this.cmd = cmd;
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
    let dockerCmd = `run -d --name ${this.name}`;
    if (this.netHost) {
      dockerCmd += ' --net host';
    }
    this.portMappings.forEach(portMapping => {
      dockerCmd += ` -p ${portMapping}`;
    });
    Object.entries(this.env).forEach(([key, value]) => {
      dockerCmd += ` -e ${key}="${value}"`;
    });
    dockerCmd += ` ${this.image}`;
    this.cmd.forEach(token => {
      dockerCmd += ` ${token}`;
    });
    await docker.command(dockerCmd);
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
