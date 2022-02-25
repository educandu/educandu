import PropTypes from 'prop-types';
import classNames from 'classnames';
import React, { useState } from 'react';
import { ALERT_TYPE } from '../domain/constants.js';
import UiLanguageDialog from './ui-language-dialog.js';
import DefaultPageHeader from './default-page-header.js';
import DefaultPageFooter from './default-page-footer.js';
import CookieConsentDrawer from './cookie-consent-drawer.js';

function DefaultPageTemplate({ children, fullScreen, alerts }) {
  const [isUiLanguageDialogVisible, setIsUiLanguageDialogVisible] = useState(false);

  const handleUiLanguageDialogClose = () => {
    setIsUiLanguageDialogVisible(false);
  };

  const handleUiLanguageClick = () => {
    setIsUiLanguageDialogVisible(true);
  };

  const contentAreaClasses = classNames({
    'DefaultPageTemplate-contentArea': true,
    'DefaultPageTemplate-contentArea--fullScreen': fullScreen
  });

  const contentClasses = classNames({
    'DefaultPageTemplate-content': true,
    'DefaultPageTemplate-content--fullScreen': fullScreen
  });

  return (
    <div className="DefaultPageTemplate">
      <DefaultPageHeader fullScreen={fullScreen} alerts={alerts} onUiLanguageClick={handleUiLanguageClick} />
      <main className={contentAreaClasses}>
        <div className={contentClasses}>
          {children}
        </div>
      </main>
      <DefaultPageFooter />
      <UiLanguageDialog visible={isUiLanguageDialogVisible} onClose={handleUiLanguageDialogClose} />
      <CookieConsentDrawer />
    </div>
  );
}

DefaultPageTemplate.propTypes = {
  alerts: PropTypes.arrayOf(PropTypes.shape({
    message: PropTypes.node.isRequired,
    type: PropTypes.oneOf(Object.values(ALERT_TYPE))
  })),
  children: PropTypes.node,
  fullScreen: PropTypes.bool
};

DefaultPageTemplate.defaultProps = {
  alerts: [],
  children: null,
  fullScreen: false
};

export default DefaultPageTemplate;
