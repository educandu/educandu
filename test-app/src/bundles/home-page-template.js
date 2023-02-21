import React from 'react';
import PropTypes from 'prop-types';
import SiteLogo from './site-logo.js';
import { useTranslation } from 'react-i18next';
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
              <img src="/images/pictogram-search.svg" />
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
          <div className="HomePageTemplate-underFoldDocumentsStripe">
            <div className="HomePageTemplate-underFoldDocuments">
              <HomepageDocumentCards />
            </div>
          </div>
        </section>
        <div className="HomePageTemplate-sponsorsFooter">
          {t('homePage.supportedBy')}
          <div className="HomePageTemplate-sponsors">
            <a className="HomePageTemplate-sponsor" href="https://stiftung-hochschullehre.de/" target="_blank" rel="noreferrer">
              <img src="/images/sih-logo.svg" />
            </a>
            <a className="HomePageTemplate-sponsor" href="https://www.hmtm.de/de/" target="_blank" rel="noreferrer">
              <img src="/images/hmtm-logo.svg" />
            </a>
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
