import Login from '@educandu/educandu/components/pages/login.js';
import Account from '@educandu/educandu/components/pages/account.js';
import Register from '@educandu/educandu/components/pages/register.js';
import { hydrateApp } from '@educandu/educandu/bootstrap/client-bootstrapper.js';
import ResetPassword from '@educandu/educandu/components/pages/reset-password.js';
import CompleteRegistration from '@educandu/educandu/components/pages/complete-registration.js';
import CompletePasswordReset from '@educandu/educandu/components/pages/complete-password-reset.js';

hydrateApp({
  'login': Login,
  'account': Account,
  'register': Register,
  'reset-password': ResetPassword,
  'complete-registration': CompleteRegistration,
  'complete-password-reset': CompletePasswordReset
});
