import md5 from 'md5';
import classNames from 'classnames';
import Markdown from './markdown.js';
import CustomAlert from './custom-alert.js';
import { useService } from './container-context.js';
import { useSettings } from './settings-context.js';
import { useScrollTopOffset } from '../ui/hooks.js';
import NavigationMobile from './navigation-mobile.js';
import NavigationDesktop from './navigation-desktop.js';
import ClientConfig from '../bootstrap/client-config.js';
import DefaultHeaderLogo from './default-header-logo.js';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getCookie, setLongLastingCookie } from '../common/cookie.js';

const generateCookieHash = textInAllLanguages => {
  return textInAllLanguages ? md5(JSON.stringify(textInAllLanguages)) : '';
};

function DefaultPageHeader() {
  const settings = useSettings();
  const headerRef = useRef(null);
  const { announcementCookieNamePrefix } = useService(ClientConfig);

  const topOffset = useScrollTopOffset();
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  const isScrolled = useMemo(() => topOffset > 0, [topOffset]);
  const scrolledHeaderPadding = useMemo(() => isScrolled ? headerRef.current?.getBoundingClientRect()?.height : 0, [headerRef, isScrolled]);

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
    <header className="DefaultPageHeader" ref={headerRef} style={{ paddingBottom: `${scrolledHeaderPadding}px` }}>
      <div className={classNames('DefaultPageHeader-container', { 'is-sticky': isScrolled })}>
        <div className="DefaultPageHeader-content">
          <div className="DefaultPageHeader-logo">
            <DefaultHeaderLogo />
          </div>
          <div className="DefaultPageHeader-navigation DefaultPageHeader-navigation--desktop">
            <NavigationDesktop />
          </div>
          <div className="DefaultPageHeader-navigation DefaultPageHeader-navigation--mobile">
            <NavigationMobile />
          </div>
        </div>
        {!!showAnnouncement && (
          <CustomAlert
            closable
            banner
            type={settings.announcement.type}
            message={<Markdown>{settings.announcement.text}</Markdown>}
            className="DefaultPageHeader-announcement"
            onClose={handleAnnouncementClose}
            />
        )}
      </div>
    </header>
  );
}

export default DefaultPageHeader;
