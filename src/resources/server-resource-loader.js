import { promises as fs } from 'fs';

export default class ResourceLoader {
  async loadResourceBundles() {
    return JSON.parse(await fs.readFile('./dist/resources.json', 'utf8'));
  }
}
