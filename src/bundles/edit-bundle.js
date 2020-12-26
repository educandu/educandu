import Docs from '../components/pages/docs';
import Menus from '../components/pages/menus';
import Users from '../components/pages/users';
import EditDoc from '../components/pages/edit-doc';
import Settings from '../components/pages/settings';
import EditMenu from '../components/pages/edit-menu';
import { hydrateApp } from '../bootstrap/client-bootstrapper';

hydrateApp({
  'docs': Docs,
  'menus': Menus,
  'users': Users,
  'edit-doc': EditDoc,
  'settings': Settings,
  'edit-menu': EditMenu
});
