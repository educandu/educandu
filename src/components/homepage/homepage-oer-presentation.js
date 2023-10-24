import React from 'react';
import { Button } from 'antd';
import Markdown from '../markdown.js';
import routes from '../../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { useRequest } from '../request-context.js';

function HomepageOerPresentation() {
  const request = useRequest();
  const { t } = useTranslation('homepageOerPresentation');

  const handleSignUpClick = () => {
    window.location = routes.getRegisterUrl();
  };

  const redirectPath = routes.getPreferredLoginRedirectUrlForCurrentUrl(request.originalUrl);
  const logInUrl = routes.getLoginUrl(redirectPath);

  return (
    <div className="HomepageOerPresentation">
      <div className="HomepageOerPresentation-headline">
        {t('headline')}
      </div>
      <div className="HomepageOerPresentation-description">
        <Markdown>{t('descriptionMarkdown')}</Markdown>
      </div>
      <div className="HomepageOerPresentation-button">
        <Button type="primary" size="large" onClick={handleSignUpClick}>{t('signUp')}</Button>
      </div>
      <a href={logInUrl}>{t('common:logInAlternative')}</a>
    </div>
  );
}

export default HomepageOerPresentation;
