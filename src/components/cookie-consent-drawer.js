import { Button, Drawer } from 'antd';
import React, { useState } from 'react';
import cookie from '../common/cookie.js';
import { useTranslation } from 'react-i18next';

const EDUCANDU_COOKIE_CONSENT = 'educanduCookieConsent';

export default function CookieConsentDrawer() {
  const consentCookie = cookie.get(EDUCANDU_COOKIE_CONSENT);
  const [isVisible, setIsVisible] = useState(!consentCookie);

  const handleClose = () => {
    cookie.set(EDUCANDU_COOKIE_CONSENT, 'true', { expires: 365 });
    setIsVisible(false);
  };

  const { t } = useTranslation('cookieConsentDrawer');

  return (
    <Drawer title={t('consentTitle')} placement="bottom" visible={isVisible} closable={false}>
      <div className="CookieConsentDrawer-contentContainer">
        <div className="CookieConsentDrawer-content">
          <p>{t('consentText')}</p>
          <Button className="CookieConsentDrawer-acceptButton" type="primary" onClick={handleClose} >{t('common:accept')}</Button>
        </div>
      </div>
    </Drawer>
  );
}
