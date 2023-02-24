import React from 'react';
import { useTranslation } from 'react-i18next';

function HomepageSponsors() {
  const { t } = useTranslation('testApp');

  return (
    <div className="HomepageSponsors">
      {t('homepage.supportedBy')}
      <div className="HomepageSponsors-content">
        <a className="HomepageSponsors-logo" href="https://stiftung-hochschullehre.de/" target="_blank" rel="noreferrer">
          <img src="/images/sih-logo.svg" />
        </a>
        <a className="HomepageSponsors-logo" href="https://www.hmtm.de/de/" target="_blank" rel="noreferrer">
          <img src="/images/hmtm-logo.svg" />
        </a>
      </div>
    </div>
  );
}

export default HomepageSponsors;
