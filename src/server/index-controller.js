const PageRenderer = require('./page-renderer');
const Index = require('../components/pages/index.jsx');

class IndexController {
  static get inject() { return [PageRenderer]; }

  constructor(pageRenderer) {
    this.pageRenderer = pageRenderer;
  }

  registerPages(app) {
    app.get('/', (req, res) => {
      return this.pageRenderer.sendPage(req, res, 'index', Index, {});
    });
  }
}

module.exports = IndexController;
