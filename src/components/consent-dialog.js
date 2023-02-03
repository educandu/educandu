import md5 from 'md5';
import { Button, Modal } from 'antd';
import Markdown from './markdown.js';
import { useTranslation } from 'react-i18next';
import { useLocale } from './locale-context.js';
import { useService } from './container-context.js';
import { useSettings } from './settings-context.js';
import ClientConfig from '../bootstrap/client-config.js';
import React, { useEffect, useState, useMemo } from 'react';
import CookieAlertIcon from './icons/general/cookie-alert-icon.js';
import { getCookie, setLongLastingCookie } from '../common/cookie.js';

const generateCookieHash = consentTextInAllLanguages => {
  return consentTextInAllLanguages ? md5(JSON.stringify(consentTextInAllLanguages)) : '';
};

export default function ConsentDialog() {
  const { t } = useTranslation('consentDialog');
  const { consentCookieNamePrefix } = useService(ClientConfig);

  const settings = useSettings();
  const { uiLanguage } = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  const actualCookieName = `${consentCookieNamePrefix}_${useMemo(() => generateCookieHash(settings.consentText), [settings.consentText])}`;

  useEffect(() => {
    const consentCookie = getCookie(actualCookieName);
    if (!consentCookie && settings.consentText) {
      setIsOpen(true);
    }
  }, [actualCookieName, settings.consentText]);

  const handleAcceptClick = () => {
    setLongLastingCookie(actualCookieName, 'true');
    setIsOpen(false);
  };

  return (
    <Modal
      centered
      open={isOpen}
      closable={false}
      title={<div><CookieAlertIcon />&nbsp;&nbsp;{t('title')}</div>}
      footer={<Button type="primary" onClick={handleAcceptClick}>{t('acceptButton')}</Button>}
      >
      <div className="u-modal-body">
        <Markdown>{settings.consentText?.[uiLanguage] || ''}</Markdown>
      </div>
    </Modal>
  );
}

ConsentDialog.propTypes = {};
