import Doc from '../components/pages/doc';
import Menu from '../components/pages/menu';
import Index from '../components/pages/index';
import Article from '../components/pages/article';
import { hydrateApp } from '../bootstrap/client-bootstrapper';

hydrateApp({
  doc: Doc,
  menu: Menu,
  index: Index,
  article: Article
});
