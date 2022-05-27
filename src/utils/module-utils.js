import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export function resolvePathWithinPackage(moduleId, subPath) {
  const packageJsonPath = require.resolve(`${moduleId}/package.json`);
  const modulePath = path.dirname(packageJsonPath);
  return path.resolve(modulePath, subPath);
}
