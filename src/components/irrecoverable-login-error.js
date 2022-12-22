import React from 'react';
import PropTypes from 'prop-types';
import { useService } from './container-context.js';
import { Trans, useTranslation } from 'react-i18next';
import ClientConfig from '../bootstrap/client-config.js';

export default function IrrecoverableLoginError({ type }) {
  const { t } = useTranslation('irrecoverableLoginError');
  const clientConfig = useService(ClientConfig);

  let mainMessage;
  let tryShowContactAdminMessage;
  switch (type) {
    case 'loginFailedTooOften':
      mainMessage = t('loginFailedTooOften');
      tryShowContactAdminMessage = false;
      break;
    case 'userLockedOut':
      mainMessage = t('userLockedOut');
      tryShowContactAdminMessage = true;
      break;
    default:
      throw new Error(`Invalid type: '${type}'`);
  }

  let contactAdminMessage;
  if (tryShowContactAdminMessage) {
    if (clientConfig.adminEmailAddress) {
      contactAdminMessage = (
        <Trans
          t={t}
          i18nKey="contactAdminWithEmail"
          components={[<a key="email-link" href={`mailto:${encodeURIComponent(clientConfig.adminEmailAddress)}`} />]}
          />
      );
    } else {
      contactAdminMessage = t('contactAdminWithoutEmail');
    }
  } else {
    contactAdminMessage = null;
  }

  return (
    <div className="IrrecoverableLoginError">
      {!!mainMessage && (
        <div className="IrrecoverableLoginError-mainMessage">{mainMessage}</div>
      )}
      {!!contactAdminMessage && (
        <div className="IrrecoverableLoginError-contactAdminMessage">{contactAdminMessage}</div>
      )}
    </div>
  );
}

IrrecoverableLoginError.propTypes = {
  type: PropTypes.oneOf(['loginFailedTooOften', 'userLockedOut'])
};
