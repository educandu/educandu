import React from 'react';
import { PAGE_NAME } from '../domain/page-name.js';
import { ALERT_TYPE } from '../domain/constants.js';
import { useUser } from '../components/user-context.js';
import { usePageName } from '../components/page-name-context.js';
import InsufficientProfileWarning, { isProfileInsufficient } from '../components/insufficient-profile-warning.js';

export function getGlobalAlerts(pageName, user) {
  const globalAlerts = [];

  if (user && isProfileInsufficient(user) && pageName !== PAGE_NAME.mySpace) {
    globalAlerts.push({
      message: <InsufficientProfileWarning />,
      type: ALERT_TYPE.info
    });
  }

  return globalAlerts;
}

export function useGlobalAlerts() {
  const pageName = usePageName();
  const user = useUser();
  return getGlobalAlerts(pageName, user);
}
