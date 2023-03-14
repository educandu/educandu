import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import ConsentDialog from '../../../src/components/consent-dialog.js';
import DefaultSiteLogo from '../../../src/components/default-site-logo.js';
import DefaultPageFooter from '../../../src/components/default-page-footer.js';
import DefaultPageHeader from '../../../src/components/default-page-header.js';
import DefaultHeaderLogo from '../../../src/components/default-header-logo.js';
import HomepageTrustFooter from '../../../src/components/homepage/homepage-trust-footer.js';
import HomepageDocumentCards from '../../../src/components/homepage/homepage-document-cards.js';
import HomepageOerPresentation from '../../../src/components/homepage/homepage-oer-presentation.js';
import HomepageProjectPresentation from '../../../src/components/homepage/homepage-project-presentation.js';

function HomepageTemplate({ children }) {
  const { t } = useTranslation('testApp');

  return (
    <div className="HomepageTemplate">
      <main className="HomepageTemplate-main">
        <section className="HomepageTemplate-aboveFold">
          <DefaultPageHeader />
          <div className="HomepageTemplate-aboveFoldContentWrapper">
            <div className="HomepageTemplate-aboveFoldContent">
              <div className="HomepageTemplate-logo" >
                <DefaultSiteLogo inverted />
                <div className="HomepageTemplate-subtitle">{t('homepage.subtitle')}</div>
              </div>
              <div className="HomepageTemplate-children">
                {children}
              </div>
            </div>
          </div>
        </section>
        <section className="HomepageTemplate-underFold">
          <div className="HomepageTemplate-underFoldStripe HomepageTemplate-underFoldStripe--documents">
            <div className="HomepageTemplate-underFoldStripeContent">
              <HomepageDocumentCards />
            </div>
          </div>
          <div className="HomepageTemplate-underFoldStripe HomepageTemplate-underFoldStripe--project">
            <div className="HomepageTemplate-underFoldStripeContent">
              <HomepageProjectPresentation logo={(<div className="HomepageTemplate-presentationLogo"><DefaultHeaderLogo /></div>)} />
            </div>
          </div>
          <div className="HomepageTemplate-underFoldStripe HomepageTemplate-underFoldStripe--oer">
            <div className="HomepageTemplate-underFoldStripeContent">
              <HomepageOerPresentation />
            </div>
          </div>
        </section>
        <HomepageTrustFooter />
      </main>
      <DefaultPageFooter />
      <ConsentDialog />
    </div>
  );
}

HomepageTemplate.propTypes = {
  children: PropTypes.node
};

HomepageTemplate.defaultProps = {
  children: null
};

export default HomepageTemplate;
