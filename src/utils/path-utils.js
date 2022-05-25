import path from 'path';
import urls from './routes.js';
import uniqueId from './unique-id.js';
import slugify from '@sindresorhus/slugify';

export const componseUniqueFileName = (fileName, parentPath = null) => {
  const id = uniqueId.create();
  const extension = path.extname(fileName);
  const baseName = fileName.substr(0, fileName.length - extension.length);
  const slugifiedBaseName = slugify(baseName);
  const uniqueBaseName = [slugifiedBaseName, id].filter(x => x).join('-');
  const newFileName = `${uniqueBaseName}${extension}`;
  return parentPath ? urls.concatParts(parentPath, newFileName) : newFileName;
};
