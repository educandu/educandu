const Docs = require('../components/pages/docs.jsx');
const Menus = require('../components/pages/menus.jsx');
const Users = require('../components/pages/users.jsx');
const EditDoc = require('../components/pages/edit-doc.jsx');
const EditMenu = require('../components/pages/edit-menu.jsx');
const { hydrateApp } = require('../bootstrap/client-bootstrapper');

hydrateApp({
  'docs': Docs,
  'menus': Menus,
  'users': Users,
  'edit-doc': EditDoc,
  'edit-menu': EditMenu
});
