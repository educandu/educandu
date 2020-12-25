const Docs = require('../components/pages/docs');
const Menus = require('../components/pages/menus');
const Users = require('../components/pages/users');
const EditDoc = require('../components/pages/edit-doc');
const Settings = require('../components/pages/settings');
const EditMenu = require('../components/pages/edit-menu');
const { hydrateApp } = require('../bootstrap/client-bootstrapper');

hydrateApp({
  'docs': Docs,
  'menus': Menus,
  'users': Users,
  'edit-doc': EditDoc,
  'settings': Settings,
  'edit-menu': EditMenu
});
