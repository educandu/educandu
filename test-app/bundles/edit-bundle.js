import Docs from '../../src/components/pages/docs.js';
import Users from '../../src/components/pages/users.js';
import Import from '../../src/components/pages/import.js';
import ImportBatches from '../../src/components/pages/import-batches.js';
import EditDoc from '../../src/components/pages/edit-doc.js';
import Settings from '../../src/components/pages/settings.js';
import CreateImport from '../../src/components/pages/create-import.js';
import { hydrateApp } from '../../src/bootstrap/client-bootstrapper.js';

hydrateApp({
  'docs': Docs,
  'users': Users,
  'edit-doc': EditDoc,
  'settings': Settings,
  'create-import': CreateImport,
  'import-batches': ImportBatches,
  'import': Import
});
