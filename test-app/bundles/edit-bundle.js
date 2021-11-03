import Docs from '@educandu/educandu/components/pages/docs.js';
import Users from '@educandu/educandu/components/pages/users.js';
import EditDoc from '@educandu/educandu/components/pages/edit-doc.js';
import Settings from '@educandu/educandu/components/pages/settings.js';
import { hydrateApp } from '@educandu/educandu/bootstrap/client-bootstrapper.js';

hydrateApp({
  'docs': Docs,
  'users': Users,
  'edit-doc': EditDoc,
  'settings': Settings
});
