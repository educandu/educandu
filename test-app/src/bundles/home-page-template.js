import React from 'react';
import PropTypes from 'prop-types';
import SiteLogo from './site-logo.js';
import { useTranslation } from 'react-i18next';
import HomePageSponsors from './home-page-sponsors.js';
import HomePagePresentation from './home-page-presentation.js';
import ConsentDialog from '../../../src/components/consent-dialog.js';
import DefaultPageFooter from '../../../src/components/default-page-footer.js';
import DefaultPageHeader from '../../../src/components/default-page-header.js';
import HomepageDocumentCards from '../../../src/components/homepage/homepage-document-cards.js';

function HomePageTemplate({ children }) {
  const { t } = useTranslation('testApp');

  return (
    <div className="HomePageTemplate">
      <DefaultPageHeader />
      <main>
        <section className="HomePageTemplate-aboveFold">
          <div className="HomePageTemplate-aboveFoldContent">
            <div className="HomePageTemplate-pictogramSearch">
              <img src="/images/home-page-pictogram.svg" />
            </div>
            <div className="HomePageTemplate-logo" >
              <SiteLogo readonly />
              <div className="HomePageTemplate-subtitle">{t('homePage.subtitle')}</div>
            </div>
            <div>
              {children}
            </div>
          </div>
        </section>
        <section className="HomePageTemplate-underFold">
          <div className="HomePageTemplate-underFoldStripe HomePageTemplate-underFoldStripe--documents">
            <div className="HomePageTemplate-underFoldStripeContent">
              <HomepageDocumentCards />
            </div>
          </div>
          <div className="HomePageTemplate-underFoldStripe">
            <div className="HomePageTemplate-underFoldStripeContent">
              <HomePagePresentation />
            </div>
          </div>
        </section>
        <HomePageSponsors />
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
