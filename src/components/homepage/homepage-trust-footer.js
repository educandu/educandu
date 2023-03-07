import React from 'react';
import { useTranslation } from 'react-i18next';
import { cssUrl } from '../../utils/css-utils.js';
import { useService } from '../container-context.js';
import { useSettings } from '../settings-context.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';

function HomepageTrustFooter() {
  const settings = useSettings();
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('homepageTrustFooter');

  const homepageTrustLogos = settings.homepageTrustLogos;

  if (!homepageTrustLogos || !homepageTrustLogos.length) {
    return null;
  }

  const renderTrustLogo = (item, index) => {
    const logoUrl = getAccessibleUrl({ url: item.logoUrl, cdnRootUrl: clientConfig.cdnRootUrl });

    return (
      <a
        key={index}
        className="HomepageTrustFooter-logo"
        href={item.institutionUrl}
        target="_blank"
        rel="noreferrer"
        >
        <div
          className="HomepageTrustFooter-logoImage"
          style={{ backgroundImage: cssUrl(logoUrl) }}
          />
      </a>
    );
  };

  return (
    <div className="HomepageTrustFooter">
      {t('supportedBy')}
      <div className="HomepageTrustFooter-content">
        {homepageTrustLogos.map(renderTrustLogo)}
      </div>
    </div>
  );
}

export default HomepageTrustFooter;
