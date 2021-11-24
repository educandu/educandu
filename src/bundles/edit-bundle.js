import Docs from '../components/pages/docs.js';
import Users from '../components/pages/users.js';
import Imports from '../components/pages/imports.js';
import EditDoc from '../components/pages/edit-doc.js';
import Settings from '../components/pages/settings.js';
import { hydrateApp } from '../bootstrap/client-bootstrapper.js';

hydrateApp({
  'docs': Docs,
  'users': Users,
  'edit-doc': EditDoc,
  'settings': Settings,
  'imports': Imports
});
