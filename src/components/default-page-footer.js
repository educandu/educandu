import routes from '../utils/routes.js';
import React, { Fragment } from 'react';
import { useLocale } from './locale-context.js';
import { useSettings } from './settings-context.js';

function DefaultPageFooter() {
  const settings = useSettings();
  const { uiLanguage } = useLocale();

  const links = (settings?.footerLinks?.[uiLanguage] || []).filter(link => link.linkTitle && link.documentId);

  return (
    <footer className="DefaultPageFooter">
      {links.map((link, index) => (
        <Fragment key={index.toString()}>
          <span className="DefaultPageFooter-linkWrapper">
            <a className="DefaultPageFooter-link" href={routes.getDocUrl({ id: link.documentId })}>{link.linkTitle}</a>
          </span>
          <div className="DefaultPageFooter-linkDivider"> | </div>
        </Fragment>
      ))}
    </footer>
  );
}

export default DefaultPageFooter;
