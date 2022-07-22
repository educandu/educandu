import React from 'react';
import routes from '../../../src/utils/routes.js';
import { useLocale } from '../../../src/components/locale-context.js';
import { useSettings } from '../../../src/components/settings-context.js';

function PageFooter() {
  const settings = useSettings();
  const { uiLanguage } = useLocale();

  return (
    <footer className="PageFooter">
      <div>
        {(settings?.footerLinks?.[uiLanguage] || []).map((fl, index) => (
          <span key={index.toString()} className="PageFooter-link">
            <a href={routes.getDocUrl({ id: fl.documentId })}>{fl.linkTitle}</a>
          </span>
        ))}
      </div>
    </footer>
  );
}

export default PageFooter;
