import React from 'react';
import PropTypes from 'prop-types';
import SiteLogo from './site-logo.js';
import { useTranslation } from 'react-i18next';
import HomePageIllustration from './home-page-illustration.js';
import ConsentDialog from '../../../src/components/consent-dialog.js';
import DefaultPageFooter from '../../../src/components/default-page-footer.js';
import DefaultPageHeader from '../../../src/components/default-page-header.js';

function HomePageTemplate({ children }) {
  const { t } = useTranslation('testApp');

  return (
    <div className="HomePageTemplate">
      <DefaultPageHeader />
      <main className="HomePageTemplate-contentArea">
        <div className="HomePageTemplate-content">
          <div className="HomePageTemplate-logo" >
            <SiteLogo readonly />
            <div className="HomePageTemplate-subtitle">{t('homePage.subtitle')}</div>
          </div>
          <div>
            {children}
          </div>
          <div className="HomePageTemplate-illustration">
            <HomePageIllustration />
          </div>
        </div>
      </main>
      <DefaultPageFooter />
      <ConsentDialog />
    </div>
  );
}

HomePageTemplate.propTypes = {
  children: PropTypes.node
};

HomePageTemplate.defaultProps = {
  children: null
};

export default HomePageTemplate;
