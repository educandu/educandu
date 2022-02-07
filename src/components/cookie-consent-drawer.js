import { Button } from 'antd';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { useService } from './container-context.js';
import { WarningOutlined } from '@ant-design/icons';
import ClientConfig from '../bootstrap/client-config.js';
import React, { useEffect, useState, useRef } from 'react';
import { getCookie, setLongLastingCookie } from '../common/cookie.js';

export default function CookieConsentDrawer() {
  const lastActiveElementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useTranslation('cookieConsentDrawer');
  const { consentCookieName } = useService(ClientConfig);

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
    const consentCookie = getCookie(consentCookieName);
    if (!consentCookie) {
      lastActiveElementRef.current = document.activeElement;
      setIsVisible(true);
    }
  }, [consentCookieName]);

  const handleAcceptButtonClick = () => {
    setLongLastingCookie(consentCookieName, 'true');
    setIsVisible(false);
    lastActiveElementRef.current?.focus?.();
    lastActiveElementRef.current = null;
  };

  return (
    <div className={classNames('CookieConsentDrawer', { 'is-enabled': isVisible })}>
      <div className="CookieConsentDrawer-overlay" />
      <div className="CookieConsentDrawer-drawer">
        <div className="CookieConsentDrawer-icon">
          <WarningOutlined size="large" />
        </div>
        <div className="CookieConsentDrawer-consentText">
          {t('consentText')}
        </div>
        <div className="CookieConsentDrawer-acceptButton">
          <Button onClick={handleAcceptButtonClick} type="primary">
            {t('common:accept')}
          </Button>
        </div>
      </div>
    </div>
  );
}

CookieConsentDrawer.propTypes = {};
