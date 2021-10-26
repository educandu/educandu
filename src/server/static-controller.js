import url from 'url';
import express from 'express';

const staticConfig = [
  {
    root: '/',
    destination: '../../dist'
  },
  {
    root: '/',
    destination: '../../static'
  },
  {
    root: '/images/flags',
    destination: '../../node_modules/flag-icon-css/flags'
  },
  {
    root: '/fonts/fontawesome',
    destination: '../../node_modules/@fortawesome/fontawesome-free/webfonts'
  }
];

class StaticController {
  registerMiddleware(router) {
    staticConfig.forEach(({ root, destination }) => {
      const dir = url.fileURLToPath(new URL(destination, import.meta.url));
      router.use(root, express.static(dir));
    });
  }
}

export default StaticController;
