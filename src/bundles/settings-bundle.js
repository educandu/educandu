import Login from 'Components/pages/login';
import Account from 'Components/pages/account';
import Register from 'Components/pages/register';
import { hydrateApp } from '../bootstrap/client-bootstrapper';
import ResetPassword from 'Components/pages/reset-password';
import CompleteRegistration from 'Components/pages/complete-registration';
import CompletePasswordReset from 'Components/pages/complete-password-reset';

hydrateApp({
  'login': Login,
  'account': Account,
  'register': Register,
  'reset-password': ResetPassword,
  'complete-registration': CompleteRegistration,
  'complete-password-reset': CompletePasswordReset
});
