import md5 from 'md5';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Markdown from './markdown.js';
import CustomAlert from './custom-alert.js';
import { useService } from './container-context.js';
import useDimensionsNs from 'react-cool-dimensions';
import { useSettings } from './settings-context.js';
import { useScrollTopOffset } from '../ui/hooks.js';
import NavigationMobile from './navigation-mobile.js';
import NavigationDesktop from './navigation-desktop.js';
import ClientConfig from '../bootstrap/client-config.js';
import DefaultHeaderLogo from './default-header-logo.js';
import React, { useEffect, useMemo, useState } from 'react';
import { getCookie, setLongLastingCookie } from '../common/cookie.js';

const useDimensions = useDimensionsNs.default || useDimensionsNs;

const generateCookieHash = textInAllLanguages => {
  return textInAllLanguages ? md5(JSON.stringify(textInAllLanguages)) : '';
};

function DefaultPageHeader({ focusContent, headerRef }) {
  const settings = useSettings();
  const topOffset = useScrollTopOffset();
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const { announcementCookieNamePrefix } = useService(ClientConfig);
  const { observe, height } = useDimensions({ useBorderBoxSize: true });

  const isSticky = !!topOffset || !!focusContent;
  const cookieHash = useMemo(() => generateCookieHash(JSON.stringify(settings.announcement)), [settings.announcement]);
  const announcementCookieName = `${announcementCookieNamePrefix}_${cookieHash}`;

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
    <header className="DefaultPageHeader" style={{ paddingBottom: `${isSticky ? height : 0}px` }}>
      <div ref={observe} className={classNames('DefaultPageHeader-container', { 'is-sticky': isSticky })}>
        <div ref={headerRef} className="DefaultPageHeader-contentWrapper">
          {!!focusContent && (
            <div>{focusContent}</div>
          )}
          {!focusContent && (
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
          )}
          {!focusContent && !!showAnnouncement && (
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
      </div>
    </header>
  );
}

DefaultPageHeader.propTypes = {
  focusContent: PropTypes.node,
  headerRef: PropTypes.object
};

DefaultPageHeader.defaultProps = {
  focusContent: null,
  headerRef: null
};

export default DefaultPageHeader;
