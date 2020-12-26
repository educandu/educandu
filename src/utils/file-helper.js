import fs from 'fs';
import util from 'util';

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
