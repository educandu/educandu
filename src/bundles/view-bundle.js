import Doc from '../components/pages/doc';
import Index from '../components/pages/index';
import Article from '../components/pages/article';
import Search from '../components/pages/search';
import { hydrateApp } from '../bootstrap/client-bootstrapper';

hydrateApp({
  doc: Doc,
  index: Index,
  article: Article,
  search: Search
});
