import routes from '../utils/routes.js';
import React, { Fragment } from 'react';
import { useLocale } from './locale-context.js';
import { useSettings } from './settings-context.js';

function DefaultPageFooter() {
  const settings = useSettings();
  const { uiLanguage } = useLocale();

  return (
    <footer className="DefaultPageFooter">
      {(settings?.footerLinks?.[uiLanguage] || []).map((fl, index) => (
        <Fragment key={index.toString()}>
          <span className="DefaultPageFooter-linkWrapper">
            <a className="DefaultPageFooter-link" href={routes.getDocUrl({ id: fl.documentId })}>{fl.linkTitle}</a>
          </span>
          <div className="DefaultPageFooter-linkDivider"> | </div>
        </Fragment>
      ))}
    </footer>
  );
}

export default DefaultPageFooter;
