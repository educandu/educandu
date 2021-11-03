import fs from 'fs';
import path from 'path';
import util from 'util';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export function resolvePathWithinPackage(moduleId, subPath) {
  const packageJsonPath = require.resolve(`${moduleId}/package.json`);
  const modulePath = path.dirname(packageJsonPath);
  return path.resolve(modulePath, subPath);
}

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

export async function readJson(fileName) {
  return JSON.parse(await readFile(fileName, 'utf8'));
}

export function writeJson(fileName, content) {
  return writeFile(fileName, JSON.stringify(content), 'utf8');
}

export default {
  readJson,
  writeJson
};
