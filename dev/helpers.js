import os from 'os';
import globModule from 'glob';
import { promisify } from 'util';

export function delay(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export const glob = promisify(globModule);

export function isMac() {
  return os.platform() === 'darwin';
}

export function kebabToCamel(str) {
  return str.replace(/-[a-z0-9]/g, c => c.toUpperCase()).replace(/-/g, '');
}

export function noop() {}
