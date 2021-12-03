import React from 'react';
import urls from '../utils/urls.js';
import { useUser } from './user-context.js';
import { Trans, useTranslation } from 'react-i18next';

const userHasSufficientProfile = user => user.profile && (user.profile.firstName || user.profile.lastName);

export function isProfileInsufficient(user) {
  return user && !userHasSufficientProfile(user);
}

export function useIsProfileInsufficient() {
  const user = useUser();
  return isProfileInsufficient(user);
}

export default function InsufficientProfileWarning() {
  const { t } = useTranslation('insufficientProfileWarning');
  return (
    <Trans
      t={t}
      i18nKey="profileWarning"
      components={[<a key="profile-warning" href={urls.getAccountUrl()} />]}
      />
  );
}
