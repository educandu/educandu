import PropTypes from 'prop-types';
import { Button, Drawer } from 'antd';
import cookie from '../common/cookie.js';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';

export default function CookieConsentDrawer({ cookieName }) {
  const [isVisible, setIsVisible] = useState();

  useEffect(() => {
    const consentCookie = cookie.get(cookieName);
    setIsVisible(!consentCookie);
  }, [cookieName]);

  const handleClose = () => {
    cookie.set(cookieName, 'true', { expires: 365 });
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

CookieConsentDrawer.propTypes = {
  cookieName: PropTypes.string.isRequired
};
