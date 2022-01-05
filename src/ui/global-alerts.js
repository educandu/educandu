import cookie from '../common/cookie.js';
import Markdown from '../components/markdown.js';
import { PAGE_NAME } from '../domain/page-name.js';
import React, { useEffect, useState } from 'react';
import { ALERT_TYPE } from '../domain/constants.js';
import { useUser } from '../components/user-context.js';
import { useSettings } from '../components/settings-context.js';
import { usePageName } from '../components/page-name-context.js';
import InsufficientProfileWarning, { isProfileInsufficient } from '../components/insufficient-profile-warning.js';

const ANNONCEMENT_COOKIE = 'ANNOUNCEMENT_SHOWN';

function getGlobalAlerts(pageName, user, settings) {
  const globalAlerts = [];

  if (user && isProfileInsufficient(user) && pageName !== PAGE_NAME.mySpace) {
    globalAlerts.push({
      message: <InsufficientProfileWarning />,
      type: ALERT_TYPE.info,
      showInFullScreen: false
    });
  }

  if (!cookie.get(ANNONCEMENT_COOKIE) && settings.announcement) {
    globalAlerts.push({
      message: <Markdown inline>{settings.announcement}</Markdown>,
      type: ALERT_TYPE.warning,
      showInFullScreen: true,
      closable: true,
      onClose: () => cookie.set(ANNONCEMENT_COOKIE, 'true')
    });
  }

  return globalAlerts;
}

export function useGlobalAlerts() {
  const pageName = usePageName();
  const settings = useSettings();
  const user = useUser();
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    setAlerts(getGlobalAlerts(pageName, user, settings));
  }, [pageName, settings, user]);

  return alerts;
}
