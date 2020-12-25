const Login = require('../components/pages/login');
const Profile = require('../components/pages/profile');
const Register = require('../components/pages/register');
const { hydrateApp } = require('../bootstrap/client-bootstrapper');
const ResetPassword = require('../components/pages/reset-password');
const CompleteRegistration = require('../components/pages/complete-registration');
const CompletePasswordReset = require('../components/pages/complete-password-reset');

hydrateApp({
  'login': Login,
  'profile': Profile,
  'register': Register,
  'reset-password': ResetPassword,
  'complete-registration': CompleteRegistration,
  'complete-password-reset': CompletePasswordReset
});
