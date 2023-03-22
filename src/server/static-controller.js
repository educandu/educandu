import express from 'express';
import { fileURLToPath } from 'node:url';
import ServerConfig from '../bootstrap/server-config.js';

class StaticController {
  static dependencies = [ServerConfig];

  constructor(serverConfig) {
    this.serverConfig = serverConfig;
  }

  registerMiddleware(router) {
    const imagesDirUrl = new URL('../images', import.meta.url);
    const imagesDirPath = fileURLToPath(imagesDirUrl);

    const mergedConfig = [
      { publicPath: '/images/', destination: imagesDirPath, setHeaders: null },
      ...this.serverConfig.publicFolders
    ];

    mergedConfig.forEach(({ publicPath, destination, setHeaders }) => {
      router.use(publicPath, express.static(destination, { setHeaders }));
    });
  }
}

export default StaticController;
