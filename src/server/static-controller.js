import express from 'express';
import ServerConfig from '../bootstrap/server-config.js';

class StaticController {
  static get inject() { return [ServerConfig]; }

  constructor(serverConfig) {
    this.serverConfig = serverConfig;
  }

  registerMiddleware(router) {
    const mergedConfig = this.serverConfig.publicFolders.map(x => ({ root: '/', destination: x }));
    mergedConfig.forEach(({ root, destination }) => {
      router.use(root, express.static(destination));
    });
  }
}

export default StaticController;
