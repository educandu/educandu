import Docs from '../components/pages/docs';
import Users from '../components/pages/users';
import EditDoc from '../components/pages/edit-doc';
import Settings from '../components/pages/settings';
import { hydrateApp } from '../bootstrap/client-bootstrapper';

hydrateApp({
  'docs': Docs,
  'users': Users,
  'edit-doc': EditDoc,
  'settings': Settings
});
