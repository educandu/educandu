import React from 'react';
import urls from '../../../src/utils/urls.js';
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
            <a href={urls.getDocUrl({ key: fl.documentKey })}>{fl.linkTitle}</a>
          </span>
        ))}
      </div>
    </footer>
  );
}

export default PageFooter;
