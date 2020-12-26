import path from 'path';
import uniqueId from './unique-id';

function insertBeforeExtension(fileName, stringToInsert) {
  const index = fileName.indexOf('.');
  if (index === -1) {
    return fileName + stringToInsert;
  }

  return fileName.substr(0, index) + stringToInsert + fileName.substr(index);
}

export function makeUnique(fileName) {
  const id = uniqueId.create();
  const baseName = path.basename(fileName);
  const fileNameWithoutBaseName = fileName.substr(0, fileName.length - baseName.length);
  const uniqueBaseName = insertBeforeExtension(baseName, `_${id}`);
  return fileNameWithoutBaseName + uniqueBaseName;
}

export default {
  makeUnique
};
