import PropTypes from 'prop-types';
import { Button, Drawer } from 'antd';
import React, { useState } from 'react';
import cookie from '../common/cookie.js';
import { useTranslation } from 'react-i18next';

export default function CookieConsentDrawer({ cookieName }) {
  const consentCookie = cookie.get(cookieName);
  const [isVisible, setIsVisible] = useState(!consentCookie);

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
