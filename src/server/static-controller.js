import express from 'express';
import { fileURLToPath } from 'node:url';
import ServerConfig from '../bootstrap/server-config.js';

class StaticController {
  static get inject() { return [ServerConfig]; }

  constructor(serverConfig) {
    this.serverConfig = serverConfig;
  }

  registerMiddleware(router) {
    const imagesDirUrl = new URL('../images', import.meta.url);
    const imagesDirPath = fileURLToPath(imagesDirUrl);

    const mergedConfig = [
      { root: '/images/', destination: imagesDirPath },
      ...this.serverConfig.publicFolders.map(x => ({ root: '/', destination: x }))
    ];

    mergedConfig.forEach(({ root, destination }) => {
      router.use(root, express.static(destination));
    });
  }
}

export default StaticController;
