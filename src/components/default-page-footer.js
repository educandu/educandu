import React from 'react';
import routes from '../utils/routes.js';
import { useLocale } from './locale-context.js';
import { useSettings } from './settings-context.js';

function DefaultPageFooter() {
  const settings = useSettings();
  const { uiLanguage } = useLocale();

  return (
    <footer className="DefaultPageFooter">
      <div>
        {(settings?.footerLinks?.[uiLanguage] || []).map((fl, index) => (
          <span key={index.toString()} className="DefaultPageFooter-link">
            <a href={routes.getDocUrl({ id: fl.documentId })}>{fl.linkTitle}</a>
          </span>
        ))}
      </div>
    </footer>
  );
}

export default DefaultPageFooter;
