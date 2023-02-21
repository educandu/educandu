import md5 from 'md5';
import { Alert } from 'antd';
import Markdown from './markdown.js';
import { useSettings } from './settings-context.js';
import { useService } from './container-context.js';
import NavigationMobile from './navigation-mobile.js';
import NavigationDesktop from './navigation-desktop.js';
import ClientConfig from '../bootstrap/client-config.js';
import DefaultHeaderLogo from './default-header-logo.js';
import React, { useEffect, useMemo, useState } from 'react';
import { getCookie, setLongLastingCookie } from '../common/cookie.js';

const generateCookieHash = textInAllLanguages => {
  return textInAllLanguages ? md5(JSON.stringify(textInAllLanguages)) : '';
};

function DefaultPageHeader() {
  const settings = useSettings();
  const { announcementCookieNamePrefix } = useService(ClientConfig);

  const [showAnnouncement, setShowAnnouncement] = useState(false);

  const announcementCookieName = `${announcementCookieNamePrefix}_${useMemo(() => generateCookieHash(JSON.stringify(settings.announcement)), [settings.announcement])}`;

  useEffect(() => {
    const announcementCookie = getCookie(announcementCookieName);
    if (!announcementCookie && settings.announcement?.text) {
      setShowAnnouncement(true);
    }
  }, [announcementCookieName, settings.announcement]);

  const handleAnnouncementClose = () => {
    setLongLastingCookie(announcementCookieName, 'true');
    setShowAnnouncement(false);
  };

  return (
    <header className="DefaultPageHeader">
      <div className="DefaultPageHeader-content">
        <DefaultHeaderLogo />
        <div className="DefaultPageHeader-navigation DefaultPageHeader-navigation--desktop">
          <NavigationDesktop />
        </div>
        <div className="DefaultPageHeader-navigation DefaultPageHeader-navigation--mobile">
          <NavigationMobile />
        </div>
      </div>
      {!!showAnnouncement && (
        <Alert
          closable
          banner
          type={settings.announcement.type}
          message={<Markdown>{settings.announcement.text}</Markdown>}
          className="DefaultPageHeader-announcement"
          onClose={handleAnnouncementClose}
          />
      )}
    </header>
  );
}

export default DefaultPageHeader;
