import React from 'react';
import { useTranslation } from 'react-i18next';

function HomePageSponsors() {
  const { t } = useTranslation('testApp');

  return (
    <div className="HomePageSponsors">
      {t('homePage.supportedBy')}
      <div className="HomePageSponsors-content">
        <a className="HomePageSponsors-logo" href="https://stiftung-hochschullehre.de/" target="_blank" rel="noreferrer">
          <img src="/images/sih-logo.svg" />
        </a>
        <a className="HomePageSponsors-logo" href="https://www.hmtm.de/de/" target="_blank" rel="noreferrer">
          <img src="/images/hmtm-logo.svg" />
        </a>
      </div>
    </div>
  );
}

export default HomePageSponsors;
