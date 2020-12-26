import path from 'path';
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
      const dir = path.join(__dirname, destination);
      router.use(root, express.static(dir));
    });
  }
}

export default StaticController;
