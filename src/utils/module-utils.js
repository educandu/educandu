import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export function resolvePathWithinPackage(moduleId, subPath) {
  const packageJsonPath = require.resolve(`${moduleId}/package.json`);
  const modulePath = path.dirname(packageJsonPath);
  return path.resolve(modulePath, subPath);
}
