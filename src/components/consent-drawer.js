import { Button } from 'antd';
import classNames from 'classnames';
import Markdown from './markdown.js';
import { useTranslation } from 'react-i18next';
import { useService } from './container-context.js';
import ClientConfig from '../bootstrap/client-config.js';
import React, { useEffect, useState, useRef } from 'react';
import CookieAlertIcon from './icons/general/cookie-alert-icon.js';
import { getCookie, setLongLastingCookie } from '../common/cookie.js';

const CONSENT_COOKIE_VERSION = 'm157c4noq4et';

export default function ConsentDrawer() {
  const lastActiveElementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useTranslation('consentDrawer');
  const { consentCookieNamePrefix } = useService(ClientConfig);

  const actualCookieName = `${consentCookieNamePrefix}_${CONSENT_COOKIE_VERSION}`;

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

  return (
    <div className={classNames('ConsentDrawer', { 'is-enabled': isVisible })}>
      <div className="ConsentDrawer-overlay" />
      <div className="ConsentDrawer-drawer">
        <div className="ConsentDrawer-icon">
          <CookieAlertIcon />
        </div>
        <div className="ConsentDrawer-consentText">
          <Markdown>{t('consentTextMarkdown')}</Markdown>
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
