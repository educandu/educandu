import os from 'os';
import path from 'path';
import JSZip from 'jszip';
import fse from 'fs-extra';
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

export async function writeZipFile(fileName, fileMap) {
  const archive = new JSZip();

  for (const [key, value] of Object.entries(fileMap)) {
    // eslint-disable-next-line no-await-in-loop
    archive.file(key, await fse.readFile(value));
  }

  await fse.ensureDir(path.dirname(fileName));
  await fse.writeFile(fileName, await archive.generateAsync({ type: 'nodebuffer' }));
}
