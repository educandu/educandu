import PropTypes from 'prop-types';
import React, { useState } from 'react';
import Markdown from '../../../src/components/markdown.js';
import { ALERT_TYPE } from '../../../src/domain/constants.js';
import { useSettings } from '../../../src/components/settings-context.js';
import DefaultSiteLogo from '../../../src/components/default-site-logo.js';
import UiLanguageDialog from '../../../src/components/ui-language-dialog.js';
import DefaultPageHeader from '../../../src/components/default-page-header.js';
import DefaultPageFooter from '../../../src/components/default-page-footer.js';
import CookieConsentDrawer from '../../../src/components/cookie-consent-drawer.js';

function HomePageTemplate({ children, alerts }) {
  const settings = useSettings();
  const [isUiLanguageDialogVisible, setIsUiLanguageDialogVisible] = useState(false);

  const handleUiLanguageDialogClose = () => {
    setIsUiLanguageDialogVisible(false);
  };

  const handleUiLanguageClick = () => {
    setIsUiLanguageDialogVisible(true);
  };

  return (
    <div className="DefaultPageTemplate">
      <DefaultPageHeader fullScreen alerts={alerts} onUiLanguageClick={handleUiLanguageClick} />
      <main className="DefaultPageTemplate-contentArea DefaultPageTemplate-contentArea--fullScreen">
        <div className="DefaultPageTemplate-content DefaultPageTemplate-content--fullScreen">
          <div className="HomePageTemplate-logo" >
            <DefaultSiteLogo />
          </div>
          {children}
          {settings.homepageInfo && (
            <div className="HomePageTemplate-info">
              <Markdown renderMedia>{settings.homepageInfo}</Markdown>
            </div>
          )}
        </div>
      </main>
      <DefaultPageFooter />
      <UiLanguageDialog visible={isUiLanguageDialogVisible} onClose={handleUiLanguageDialogClose} />
      <CookieConsentDrawer />
    </div>
  );
}

HomePageTemplate.propTypes = {
  alerts: PropTypes.arrayOf(PropTypes.shape({
    message: PropTypes.node.isRequired,
    type: PropTypes.oneOf(Object.values(ALERT_TYPE))
  })),
  children: PropTypes.node
};

HomePageTemplate.defaultProps = {
  alerts: [],
  children: null
};

export default HomePageTemplate;
