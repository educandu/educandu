import { Process, DEFAULT_ENV, DEFAULT_STDIO, DEFAULT_STARTUP_GRACE_PERIOD } from './process.js';

const NODE_FLAGS = [
  '--experimental-json-modules',
  '--experimental-loader',
  '@educandu/node-jsx-loader',
  '--enable-source-maps'
];

export class NodeProcess extends Process {
  constructor({
    script,
    env = DEFAULT_ENV,
    stdio = DEFAULT_STDIO,
    startupGracePeriod = DEFAULT_STARTUP_GRACE_PERIOD
  }) {
    super({
      command: process.execPath,
      args: [...NODE_FLAGS, script],
      env,
      stdio,
      startupGracePeriod
    });
  }
}
