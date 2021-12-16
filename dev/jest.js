import path from 'path';
import execa from 'execa';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const resolvedJestModule = require.resolve('jest');
const index = resolvedJestModule.replaceAll('\\', '/').lastIndexOf('/node_modules/jest/');
const rootDir = resolvedJestModule.substring(0, index);
const jestBin = path.resolve(rootDir, './node_modules/jest/bin/jest.js');

const nodeFlags = ['--experimental-vm-modules'];

function runJest(...flags) {
  const jestFlags = flags.map(flag => `--${flag}`);
  return execa(process.execPath, [...nodeFlags, jestBin, ...jestFlags], { stdio: 'inherit' });
}

export const jest = {
  coverage() {
    return runJest('coverage', 'runInBand');
  },
  changed() {
    return runJest('onlyChanged');
  },
  watch() {
    return runJest('watch');
  }
};
