import React from 'react';
import PropTypes from 'prop-types';
import urls from '../utils/urls.js';
import { settingsProps } from '../ui/default-prop-types.js';

function ErrorPage({ error, settings, uiLanguage, i18n }) {
  const backHtml = `<a onclick="window.history.back();">${i18n.t('common:back')}</a>`;
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
            {error.expose && error.stack && <pre className="ErrorPage-stack">{error.stack}</pre>}
          </div>
        </div>
      </main>
      <footer className="ErrorPage-footer">
        <div className="ErrorPage-footerContent">
          {(settings.footerLinks?.[uiLanguage] || []).map((fl, index) => (
            <span key={index.toString()} className="ErrorPage-footerLink">
              <a href={urls.getDocUrl({ key: fl.documentKey, slug: fl.documentSlug })}>{fl.linkTitle}</a>
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
