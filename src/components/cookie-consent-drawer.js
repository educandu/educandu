import { Button, Drawer } from 'antd';
import cookie from '../common/cookie.js';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { useService } from './container-context.js';
import ClientConfig from '../bootstrap/client-config.js';

export default function CookieConsentDrawer() {
  const [isVisible, setIsVisible] = useState();
  const { consentCookieName } = useService(ClientConfig);

  useEffect(() => {
    const consentCookie = cookie.get(consentCookieName);
    setIsVisible(!consentCookie);
  }, [consentCookieName]);

  const handleClose = () => {
    cookie.set(consentCookieName, 'true', { expires: 365 });
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
