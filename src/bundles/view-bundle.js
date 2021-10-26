import Doc from '../components/pages/doc.js';
import Index from '../components/pages/index.js';
import Article from '../components/pages/article.js';
import { hydrateApp } from '../bootstrap/client-bootstrapper.js';

hydrateApp({
  doc: Doc,
  index: Index,
  article: Article
});
