import httpErrors from 'http-errors';
import DocumentStore from '../src/stores/document-store.js';
import urls from '../src/utils/urls.js';

const { NotFound } = httpErrors;

class ArticleController {
  static get inject() { return [DocumentStore]; }

  constructor(documentStore) {
    this.documentStore = documentStore;
  }

  registerPages(router) {
    router.get('/articles/*', async (req, res) => {
      const slug = req.params[0] || '';
      const doc = await this.documentStore.findOne({ namespace: 'articles', slug });
      if (!doc) {
        throw new NotFound(`Article '${slug}' could  not be found`);
      }

      res.redirect(301, urls.getDocUrl(doc.key, doc.slug));
    });
  }
}

export default ArticleController;
