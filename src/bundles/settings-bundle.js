import Login from '../components/pages/login.js';
import Account from '../components/pages/account.js';
import Register from '../components/pages/register.js';
import { hydrateApp } from '../bootstrap/client-bootstrapper.js';
import ResetPassword from '../components/pages/reset-password.js';
import CompleteRegistration from '../components/pages/complete-registration.js';
import CompletePasswordReset from '../components/pages/complete-password-reset.js';

hydrateApp({
  'login': Login,
  'account': Account,
  'register': Register,
  'reset-password': ResetPassword,
  'complete-registration': CompleteRegistration,
  'complete-password-reset': CompletePasswordReset
});
