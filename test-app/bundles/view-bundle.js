import Doc from '@educandu/educandu/components/pages/doc.js';
import Index from '@educandu/educandu/components/pages/index.js';
import Article from '@educandu/educandu/components/pages/article.js';
import Search from '@educandu/educandu/components/pages/search.js';
import { hydrateApp } from '@educandu/educandu/bootstrap/client-bootstrapper.js';

hydrateApp({
  doc: Doc,
  index: Index,
  article: Article,
  search: Search
});
