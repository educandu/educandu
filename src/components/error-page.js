import React from 'react';
import PropTypes from 'prop-types';
import routes from '../utils/routes.js';
import { settingsProps } from '../ui/default-prop-types.js';
import { HTTP_STATUS } from '../domain/constants.js';

function ErrorPage({ error, settings, uiLanguage, i18n }) {
  const backHtml = error.status === HTTP_STATUS.unauthorized
    ? `<a href="${routes.getHomeUrl()}">${i18n.t('pageNames:home')}</a>`
    : `<a onclick="window.history.back();">${i18n.t('common:back')}</a>`;
  return (
    <div className="ErrorPage">
      <header className="ErrorPage-headerArea">
        <div className="ErrorPage-header">
          <div className="ErrorPage-headerContent ErrorPage-headerContent--left" />
          <div className="ErrorPage-headerContent ErrorPage-headerContent--center" />
          <div className="ErrorPage-headerContent ErrorPage-headerContent--right" />
        </div>
      </header>
      <main className="ErrorPage-contentArea">
        <div className="ErrorPage-contentContainer">
          <div className="ErrorPage-content">
            <h1 className="ErrorPage-status">{error.status}</h1>
            <h1 className="ErrorPage-message">{error.displayMessage || error.message}</h1>
            <div className="ErrorPage-back" dangerouslySetInnerHTML={{ __html: backHtml }} />
            {!!error.expose && !!error.stack && <pre className="ErrorPage-stack">{error.stack}</pre>}
          </div>
        </div>
      </main>
      <footer className="ErrorPage-footer">
        <div className="ErrorPage-footerContent">
          {(settings.footerLinks?.[uiLanguage] || []).map((fl, index) => (
            <span key={index.toString()} className="ErrorPage-footerLink">
              <a href={routes.getDocUrl({ id: fl.documentId })}>{fl.linkTitle}</a>
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}

ErrorPage.propTypes = {
  ...settingsProps,
  error: PropTypes.object.isRequired,
  i18n: PropTypes.object.isRequired,
  uiLanguage: PropTypes.string.isRequired
};

export default ErrorPage;
