import Login from '../../src/components/pages/login.js';
import Account from '../../src/components/pages/account.js';
import Register from '../../src/components/pages/register.js';
import { hydrateApp } from '../../src/bootstrap/client-bootstrapper.js';
import ResetPassword from '../../src/components/pages/reset-password.js';
import CompleteRegistration from '../../src/components/pages/complete-registration.js';
import CompletePasswordReset from '../../src/components/pages/complete-password-reset.js';

hydrateApp({
  'login': Login,
  'account': Account,
  'register': Register,
  'reset-password': ResetPassword,
  'complete-registration': CompleteRegistration,
  'complete-password-reset': CompletePasswordReset
});
