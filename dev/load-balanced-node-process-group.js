import chalk from 'chalk';
import { DEFAULT_ENV } from './process.js';
import { NodeProcess } from './node-process.js';
import { LoadBalancer } from './load-balancer.js';
import { chunksToLinesAsync, chomp } from '@rauschma/stringio';

const DEFAULT_INSTANCE_COUNT = 3;
const DEFAULT_GET_INSTANCE_ENV = () => DEFAULT_ENV;

const colors = [
  chalk.bgBlue,
  chalk.bgGreen,
  chalk.bgMagenta,
  chalk.bgCyan,
  chalk.bgYellow
];

export class LoadBalancedNodeProcessGroup {
  constructor({
    script,
    jsx = false,
    loadBalancerPort,
    getNodeProcessPort,
    instanceCount = DEFAULT_INSTANCE_COUNT,
    getInstanceEnv = DEFAULT_GET_INSTANCE_ENV
  }) {
    const downStreamPorts = [];
    this._processes = [];
    for (let index = 0; index < instanceCount; index += 1) {
      downStreamPorts.push(getNodeProcessPort(index));
      this._processes.push(new NodeProcess({
        script,
        jsx,
        env: getInstanceEnv(index),
        stdio: ['ignore', 'pipe', process.stderr]
      }));
    }
    this._loadBalancer = new LoadBalancer({
      port: loadBalancerPort,
      targets: downStreamPorts.map(p => `http://localhost:${p}`),
      onProxy: ({ index, req }) => {
        const prefix = `Proxy request to target #${index}:`;
        const message = `${chalk.white(prefix)} ${chalk.cyanBright(req.method)} ${req.url}`;
        this._log(message);
      }
    });
  }

  _log(message, index = -1) {
    const colorize = index !== -1
      ? colors[index % colors.length]
      : chalk.black.bgWhite;

    const prefix = index !== -1
      ? ` #${index} `
      : ' LB ';

    // eslint-disable-next-line no-console
    console.log(`${colorize(prefix)} ${message}`);
  }

  async _echoReadable(readable, index) {
    for await (const line of chunksToLinesAsync(readable)) {
      this._log(chomp(line), index);
    }
  }

  async start(env = {}) {
    await Promise.all(this._processes.map(async (proc, index) => {
      const child = await proc.start(env);
      this._echoReadable(child.stdout, index);
    }));
    await this._loadBalancer.start();
  }

  async restart(env = {}) {
    await this._loadBalancer.stop();
    await Promise.all(this._processes.map(async (proc, index) => {
      const child = await proc.restart(env);
      this._echoReadable(child.stdout, index);
    }));
    await this._loadBalancer.start();
  }

  async kill() {
    await this._loadBalancer.stop();
    await Promise.all(this._processes.map(proc => proc.kill()));
  }

  async waitForExit() {
    await this._loadBalancer.stop();
    await Promise.all(this._processes.map(proc => proc.waitForExit()));
  }
}
