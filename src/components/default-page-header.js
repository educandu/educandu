import React from 'react';
import NavigationMobile from './navigation-mobile.js';
import NavigationDesktop from './navigation-desktop.js';
import DefaultHeaderLogo from './default-header-logo.js';

function DefaultPageHeader() {
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
    </header>
  );
}

export default DefaultPageHeader;
