const Doc = require('../components/pages/doc.jsx');
const Menu = require('../components/pages/menu.jsx');
const Docs = require('../components/pages/docs.jsx');
const Menus = require('../components/pages/menus.jsx');
const Users = require('../components/pages/users.jsx');
const Index = require('../components/pages/index.jsx');
const Login = require('../components/pages/login.jsx');
const Profile = require('../components/pages/profile.jsx');
const Article = require('../components/pages/article.jsx');
const EditDoc = require('../components/pages/edit-doc.jsx');
const Register = require('../components/pages/register.jsx');
const EditMenu = require('../components/pages/edit-menu.jsx');
const ResetPassword = require('../components/pages/reset-password.jsx');
const CompleteRegistration = require('../components/pages/complete-registration.jsx');
const CompletePasswordReset = require('../components/pages/complete-password-reset.jsx');

module.exports = {
  'doc': Doc,
  'menu': Menu,
  'docs': Docs,
  'menus': Menus,
  'users': Users,
  'index': Index,
  'login': Login,
  'profile': Profile,
  'article': Article,
  'edit-doc': EditDoc,
  'register': Register,
  'edit-menu': EditMenu,
  'reset-password': ResetPassword,
  'complete-registration': CompleteRegistration,
  'complete-password-reset': CompletePasswordReset
};
