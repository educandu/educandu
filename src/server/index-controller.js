const PageRenderer = require('./page-renderer');

class IndexController {
  static get inject() { return [PageRenderer]; }

  constructor(pageRenderer) {
    this.pageRenderer = pageRenderer;
  }

  registerPages(app) {
    app.get('/', (req, res) => {
      return this.pageRenderer.sendPage(req, res, 'index-bundle', 'index', {});
    });
  }
}

module.exports = IndexController;
