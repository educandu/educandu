import path from 'path';
import urls from './urls.js';
import uniqueId from './unique-id.js';
import slugify from '@sindresorhus/slugify';

export function buildCdnFileName(fileName, prefix = null) {
  const id = uniqueId.create();
  const extension = path.extname(fileName);
  const baseName = fileName.substr(0, fileName.length - extension.length);
  const slugifiedBaseName = slugify(baseName);
  const uniqueBaseName = [slugifiedBaseName, id].filter(x => x).join('-');
  const newFileName = `${uniqueBaseName}${extension}`;
  return prefix ? urls.concatParts(prefix, newFileName) : newFileName;
}

export default {
  buildCdnFileName
};
