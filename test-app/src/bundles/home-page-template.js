import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import HomePageSponsors from './home-page-sponsors.js';
import HomePagePresentation from './home-page-presentation.js';
import ConsentDialog from '../../../src/components/consent-dialog.js';
import DefaultSiteLogo from '../../../src/components/default-site-logo.js';
import DefaultPageFooter from '../../../src/components/default-page-footer.js';
import DefaultPageHeader from '../../../src/components/default-page-header.js';
import HomePageDocumentCards from '../../../src/components/home-page/home-page-document-cards.js';
import HomePageOerPresentation from '../../../src/components/home-page/home-page-oer-presentation.js';

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
              <DefaultSiteLogo />
              <div className="HomePageTemplate-subtitle">{t('homePage.subtitle')}</div>
            </div>
            <div>
              {children}
            </div>
          </div>
        </section>
        <section className="HomePageTemplate-underFold">
          <div className="HomePageTemplate-underFoldStripe HomePageTemplate-underFoldStripe--colorful">
            <div className="HomePageTemplate-underFoldStripeContent">
              <HomePageDocumentCards />
            </div>
          </div>
          <div className="HomePageTemplate-underFoldStripe">
            <div className="HomePageTemplate-underFoldStripeContent">
              <HomePagePresentation />
            </div>
          </div>
          <div className="HomePageTemplate-underFoldStripe HomePageTemplate-underFoldStripe--colorful">
            <div className="HomePageTemplate-underFoldStripeContent">
              <HomePageOerPresentation />
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
