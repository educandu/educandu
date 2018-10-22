const path = require('path');
const express = require('express');

class StaticController {
  registerMiddleware(app) {
    ['../../dist', '../../static']
      .map(dir => path.join(__dirname, dir))
      .forEach(dir => app.use(express.static(dir)));
  }
}

module.exports = StaticController;
