const path = require('path');
const express = require('express');

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
  }
];

class StaticController {
  registerMiddleware(app) {
    staticConfig.forEach(({ root, destination }) => {
      const dir = path.join(__dirname, destination);
      app.use(root, express.static(dir));
    });
  }
}

module.exports = StaticController;
