import Docs from '../../src/components/pages/docs.js';
import Users from '../../src/components/pages/users.js';
import ImportBatchView from '../../src/components/pages/import-batch-view.js';
import ImportBatches from '../../src/components/pages/import-batches.js';
import EditDoc from '../../src/components/pages/edit-doc.js';
import Settings from '../../src/components/pages/settings.js';
import ImportBatchCreation from '../../src/components/pages/import-batch-creation.js';
import { hydrateApp } from '../../src/bootstrap/client-bootstrapper.js';

hydrateApp({
  'docs': Docs,
  'users': Users,
  'edit-doc': EditDoc,
  'settings': Settings,
  'import-batch-creation': ImportBatchCreation,
  'import-batches': ImportBatches,
  'import-batch-view': ImportBatchView
});
