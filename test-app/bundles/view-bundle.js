import Doc from '../../src/components/pages/doc.js';
import Index from '../../src/components/pages/index.js';
import Article from '../../src/components/pages/article.js';
import Search from '../../src/components/pages/search.js';
import { hydrateApp } from '../../src/bootstrap/client-bootstrapper.js';

hydrateApp({
  doc: Doc,
  index: Index,
  article: Article,
  search: Search
});
