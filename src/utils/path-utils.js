import path from 'path';
import urls from './urls.js';
import uniqueId from './unique-id.js';
import { createRequire } from 'module';
import slugify from '@sindresorhus/slugify';

const require = createRequire(import.meta.url);

export function resolvePathWithinPackage(moduleId, subPath) {
  const packageJsonPath = require.resolve(`${moduleId}/package.json`);
  const modulePath = path.dirname(packageJsonPath);
  return path.resolve(modulePath, subPath);
}

export const componseUniqueFileName = (fileName, parentPath = null) => {
  const id = uniqueId.create();
  const extension = path.extname(fileName);
  const baseName = fileName.substr(0, fileName.length - extension.length);
  const slugifiedBaseName = slugify(baseName);
  const uniqueBaseName = [slugifiedBaseName, id].filter(x => x).join('-');
  const newFileName = `${uniqueBaseName}${extension}`;
  return parentPath ? urls.concatParts(parentPath, newFileName) : newFileName;
};
