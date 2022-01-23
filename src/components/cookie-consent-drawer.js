import { Button } from 'antd';
import classNames from 'classnames';
import cookie from '../common/cookie.js';
import { useTranslation } from 'react-i18next';
import { useService } from './container-context.js';
import { WarningOutlined } from '@ant-design/icons';
import ClientConfig from '../bootstrap/client-config.js';
import React, { useEffect, useState, useRef } from 'react';

export default function CookieConsentDrawer() {
  const lastActiveElementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useTranslation('cookieConsentDrawer');
  const { consentCookieName } = useService(ClientConfig);

  useEffect(() => {
    const consentCookie = cookie.get(consentCookieName);
    if (!consentCookie) {
      lastActiveElementRef.current = document.activeElement;
      setIsVisible(true);
    }
  }, [consentCookieName]);

  const handleAcceptButtonClick = () => {
    cookie.set(consentCookieName, 'true', { expires: 365 });
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
