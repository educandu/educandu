import { Modal } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { useService } from './container-context.js';
import ClientConfig from '../bootstrap/client-config.js';

function ExternalAccountProviderDialog({ isOpen, onCancel, onOk }) {
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('externalAccountProviderDialog');
  const [selectedProvider, setSelectedProvider] = useState(null);
  const identityProviders = clientConfig.samlAuth?.identityProviders || [];

  const handleProviderChange = (provider, close) => {
    setSelectedProvider(provider);
    if (close) {
      onOk(provider.key);
    }
  };

  const handleOk = () => {
    onOk(selectedProvider.key);
  };

  const handleCancel = () => {
    onCancel();
  };

  useEffect(() => {
    setSelectedProvider(null);
  }, [isOpen]);

  return (
    <Modal
      title={t('title')}
      open={isOpen}
      onOk={handleOk}
      okButtonProps={{ disabled: !selectedProvider }}
      onCancel={handleCancel}
      >
      <div className="u-modal-body">
        <div className="ExternalAccountProviderDialog-explanation">{t('explanation')}</div>
        <div className="ExternalAccountProviderDialog-providers">
          {identityProviders.map(provider => (
            <div
              key={provider.key}
              onClick={() => handleProviderChange(provider, false)}
              onDoubleClick={() => handleProviderChange(provider, true)}
              className={classNames('ExternalAccountProviderDialog-provider', { 'is-selected': selectedProvider === provider })}
              >
              {!!provider.logoUrl && <img className="ExternalAccountProviderDialog-providerLogo" src={provider.logoUrl} />}
              <div className="ExternalAccountProviderDialog-providerName">{provider.displayName}</div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

ExternalAccountProviderDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onOk: PropTypes.func.isRequired
};

export default ExternalAccountProviderDialog;
