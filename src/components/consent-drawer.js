import md5 from 'md5';
import { Button } from 'antd';
import classNames from 'classnames';
import Markdown from './markdown.js';
import { useTranslation } from 'react-i18next';
import { useLocale } from './locale-context.js';
import { useService } from './container-context.js';
import { useSettings } from './settings-context.js';
import ClientConfig from '../bootstrap/client-config.js';
import CookieAlertIcon from './icons/general/cookie-alert-icon.js';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { getCookie, setLongLastingCookie } from '../common/cookie.js';

const generateCookieHash = consentTextInAllLanguages => {
  return consentTextInAllLanguages ? md5(JSON.stringify(consentTextInAllLanguages)) : '';
};

export default function ConsentDrawer() {
  const { t } = useTranslation();
  const settings = useSettings();
  const { uiLanguage } = useLocale();
  const lastActiveElementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const { consentCookieNamePrefix } = useService(ClientConfig);

  const actualCookieName = `${consentCookieNamePrefix}_${useMemo(() => generateCookieHash(settings.consentText), [settings.consentText])}`;

  useEffect(() => {
    if (!isVisible) {
      return () => {};
    }

    const handler = event => {
      event.preventDefault();
      event.stopImmediatePropagation();
    };

    document.body.addEventListener('keydown', handler, { capture: true });
    document.body.addEventListener('keyup', handler, { capture: true });

    return () => {
      document.body.removeEventListener('keydown', handler, { capture: true });
      document.body.removeEventListener('keyup', handler, { capture: true });
    };
  }, [isVisible]);

  useEffect(() => {
    const consentCookie = getCookie(actualCookieName);
    if (!consentCookie) {
      lastActiveElementRef.current = document.activeElement;
      setIsVisible(true);
    }
  }, [actualCookieName]);

  const handleAcceptButtonClick = () => {
    setLongLastingCookie(actualCookieName, 'true');
    setIsVisible(false);
    lastActiveElementRef.current?.focus?.();
    lastActiveElementRef.current = null;
  };

  if (!settings?.consentText) {
    return null;
  }

  return (
    <div className={classNames('ConsentDrawer', { 'is-enabled': isVisible })}>
      <div className="ConsentDrawer-overlay" />
      <div className="ConsentDrawer-drawer">
        <div className="ConsentDrawer-icon">
          <CookieAlertIcon />
        </div>
        <div className="ConsentDrawer-consentText">
          <Markdown>{settings.consentText[uiLanguage]}</Markdown>
        </div>
        <div className="ConsentDrawer-acceptButton">
          <Button onClick={handleAcceptButtonClick} type="primary">
            {t('common:accept')}
          </Button>
        </div>
      </div>
    </div>
  );
}

ConsentDrawer.propTypes = {};
