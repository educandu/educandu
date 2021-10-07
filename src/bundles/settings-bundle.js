import Login from '../components/pages/login';
import Account from '../components/pages/account';
import Register from '../components/pages/register';
import { hydrateApp } from '../bootstrap/client-bootstrapper';
import ResetPassword from '../components/pages/reset-password';
import CompleteRegistration from '../components/pages/complete-registration';
import CompletePasswordReset from '../components/pages/complete-password-reset';

hydrateApp({
  'login': Login,
  'account': Account,
  'register': Register,
  'reset-password': ResetPassword,
  'complete-registration': CompleteRegistration,
  'complete-password-reset': CompletePasswordReset
});
