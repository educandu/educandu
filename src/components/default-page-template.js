import Alert from './alert.js';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import React, { useState } from 'react';
import ConsentDrawer from './consent-drawer.js';
import UiLanguageDialog from './ui-language-dialog.js';
import DefaultPageHeader from './default-page-header.js';
import DefaultPageFooter from './default-page-footer.js';

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

  const renderAlert = (alert, index) => {
    const shouldRenderAlert = !fullScreen || alert.showInFullScreen;

    if (!shouldRenderAlert) {
      return null;
    }

    return (
      <Alert
        key={index}
        message={alert.message}
        closable={alert.closable || false}
        onClose={alert.onClose || (() => { })}
        />
    );
  };

  return (
    <div className="DefaultPageTemplate">
      <DefaultPageHeader onUiLanguageClick={handleUiLanguageClick} />
      <main className={contentAreaClasses}>
        <div className={contentClasses}>
          {!!alerts?.length && (
            <div className="DefaultPageTemplate-contentAlerts">
              { alerts.map((alert, index) => renderAlert(alert, index)) }
            </div>
          )}
          {children}
        </div>
      </main>
      <DefaultPageFooter />
      <UiLanguageDialog visible={isUiLanguageDialogVisible} onClose={handleUiLanguageDialogClose} />
      <ConsentDrawer />
    </div>
  );
}

DefaultPageTemplate.propTypes = {
  alerts: PropTypes.arrayOf(PropTypes.shape({
    message: PropTypes.node.isRequired,
    showInFullScreen: PropTypes.bool,
    closable: PropTypes.bool,
    onClose: PropTypes.func
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
