import Docs from '../../src/components/pages/docs.js';
import Users from '../../src/components/pages/users.js';
import EditDoc from '../../src/components/pages/edit-doc.js';
import Settings from '../../src/components/pages/settings.js';
import { hydrateApp } from '../../src/bootstrap/client-bootstrapper.js';

hydrateApp({
  'docs': Docs,
  'users': Users,
  'edit-doc': EditDoc,
  'settings': Settings
});
