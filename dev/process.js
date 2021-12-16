import { delay } from './helpers.js';
import { spawn } from 'child_process';

export const DEFAULT_ENV = { ...process.env };
export const DEFAULT_STDIO = 'inherit';
export const DEFAULT_STARTUP_GRACE_PERIOD = 250;

export class Process {
  constructor({
    command, args = [],
    env = DEFAULT_ENV,
    stdio = DEFAULT_STDIO,
    startupGracePeriod = DEFAULT_STARTUP_GRACE_PERIOD
  }) {
    this.command = command;
    this.args = args;
    this.env = env;
    this.stdio = stdio;
    this.startupGracePeriod = startupGracePeriod;
    this._process = null;
  }

  async start(env = {}) {
    if (!this._process) {
      const options = { env: { ...this.env, ...env }, stdio: this.stdio };
      this._process = spawn(this.command, this.args, options);
      this._process.once('exit', () => {
        this._process = null;
      });
    }

    await delay(this.startupGracePeriod);
    return this._process;
  }

  async restart(env = {}) {
    await Promise.all([this.waitForExit(), this.kill()]);
    return this.start(env);
  }

  async kill() {
    if (this._process) {
      this._process.kill();
      await delay(100);
    } else {
      await delay(0);
    }
  }

  waitForExit() {
    return new Promise(resolve => {
      if (this._process) {
        this._process.once('exit', async () => {
          await delay(100);
          resolve();
        });
      } else {
        delay(0).then(resolve);
      }
    });
  }
}
