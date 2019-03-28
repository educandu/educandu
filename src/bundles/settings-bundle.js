const Login = require('../components/pages/login.jsx');
const Profile = require('../components/pages/profile.jsx');
const Register = require('../components/pages/register.jsx');
const { hydrateApp } = require('../bootstrap/client-bootstrapper');
const ResetPassword = require('../components/pages/reset-password.jsx');
const CompleteRegistration = require('../components/pages/complete-registration.jsx');
const CompletePasswordReset = require('../components/pages/complete-password-reset.jsx');

hydrateApp({
  'login': Login,
  'profile': Profile,
  'register': Register,
  'reset-password': ResetPassword,
  'complete-registration': CompleteRegistration,
  'complete-password-reset': CompletePasswordReset
});
