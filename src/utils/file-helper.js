const fs = require('fs');
const util = require('util');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

async function readJson(fileName) {
  return JSON.parse(await readFile(fileName, 'utf8'));
}

function writeJson(fileName, content) {
  return writeFile(fileName, JSON.stringify(content), 'utf8');
}

module.exports = {
  readJson,
  writeJson
};
