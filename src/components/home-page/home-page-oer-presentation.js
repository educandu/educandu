import React from 'react';
import { Button } from 'antd';
import Markdown from '../markdown.js';
import routes from '../../utils/routes.js';
import { useTranslation } from 'react-i18next';

function HomePageOerPresentation() {
  const { t } = useTranslation('homePageOerPresentation');

  const handleSignUpClick = () => {
    window.location = routes.getRegisterUrl();
  };

  const logInUrl = routes.getLoginUrl();

  return (
    <div className="HomePageOerPresentation">
      <div className="HomePageOerPresentation-headline">
        {t('headline')}
      </div>
      <div className="HomePageOerPresentation-description">
        <Markdown>{t('descriptionMarkdown')}</Markdown>
      </div>
      <div className="HomePageOerPresentation-button">
        <Button type="primary" size="large" onClick={handleSignUpClick}>{t('signUp')}</Button>
      </div>
      <a href={logInUrl}>{t('logIn')}</a>
    </div>
  );
}

export default HomePageOerPresentation;
