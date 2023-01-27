import PropTypes from 'prop-types';
import { Form, Input } from 'antd';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { settingsLicenseShape } from '../../ui/default-prop-types.js';

function LicenseSettings({ license, onChange }) {
  const { t } = useTranslation();

  const name = license?.name || '';
  const url = license?.url || '';

  const handleChange = newLicense => {
    onChange(newLicense, { isValid: true });
  };

  const handleNameChange = event => {
    handleChange({ name: event.target.value, url });
  };

  const handleUrlChange = event => {
    handleChange({ name, url: event.target.value });
  };

  return (
    <div>
      <Form.Item labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} label={t('common:name')}>
        <Input value={name} onChange={handleNameChange} />
      </Form.Item>
      <Form.Item labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} label={t('common:url')}>
        <Input value={url} onChange={handleUrlChange} />
      </Form.Item>
    </div>
  );
}

LicenseSettings.propTypes = {
  license: settingsLicenseShape,
  onChange: PropTypes.func.isRequired
};

LicenseSettings.defaultProps = {
  license: null
};

export default memo(LicenseSettings);
