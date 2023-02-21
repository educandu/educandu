import React from 'react';
import { Button } from 'antd';
import Markdown from '../markdown.js';
import routes from '../../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../locale-context.js';
import { useSettings } from '../settings-context.js';

function HomepageProjectPresentation() {
  const settings = useSettings();
  const { uiLanguage } = useLocale();
  const { t } = useTranslation('homepageProjectPresentation');

  const helpPageDocument = settings?.helpPage?.[uiLanguage]?.documentId;

  const handleLearnMoreClick = () => {
    window.location = routes.getDocUrl({ id: helpPageDocument });
  };

  return (
    <div className="HomepageProjectPresentation">
      <div className="HomepageProjectPresentation-description">
        <Markdown>{t('descriptionMarkdown')}</Markdown>
      </div>
      {!!helpPageDocument && (
        <Button size="large" onClick={handleLearnMoreClick}>{t('learnMore')}</Button>
      )}
    </div>
  );
}

export default HomepageProjectPresentation;
