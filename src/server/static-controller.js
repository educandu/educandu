import express from 'express';
import ServerConfig from '../bootstrap/server-config.js';
import { resolvePathWithinPackage } from '../utils/file-helper.js';

const staticConfig = [
  {
    root: '/images/flags',
    destination: resolvePathWithinPackage('flag-icon-css', './flags')
  },
  {
    root: '/fonts/fontawesome',
    destination: resolvePathWithinPackage('@fortawesome/fontawesome-free', './webfonts')
  }
];

class StaticController {
  static get inject() { return [ServerConfig]; }

  constructor(serverConfig) {
    this.serverConfig = serverConfig;
  }

  registerMiddleware(router) {
    const mergedConfig = [
      ...staticConfig,
      ...this.serverConfig.publicFolders.map(x => ({ root: '/', destination: x }))
    ];
    mergedConfig.forEach(({ root, destination }) => {
      router.use(root, express.static(destination));
    });
  }
}

export default StaticController;
