import compression from 'compression';
import { fileURLToPath } from 'node:url';
import expressStaticGzip from 'express-static-gzip';
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
      router.use(publicPath, expressStaticGzip(destination, {
        index: false,
        enableBrotli: true,
        orderPreference: ['br', 'gz'],
        serveStatic: {
          fallthrough: true,
          setHeaders
        }
      }));
    });
  }

  registerAfterMiddleware(router) {
    router.use(compression({
      level: 6,
      threshold: 1024,
      filter: (req, res) => res.getHeader('Content-Encoding') ? false : compression.filter(req, res)
    }));
  }
}

export default StaticController;
