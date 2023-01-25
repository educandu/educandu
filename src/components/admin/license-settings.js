import PropTypes from 'prop-types';
import { Form, Input } from 'antd';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { validateUrl } from '../../ui/validation.js';
import { settingsLicenseShape } from '../../ui/default-prop-types.js';

const urlValidationOptions = { allowEmpty: true, allowHttp: true };

function LicenseSettings({ license, onChange }) {
  const { t } = useTranslation();

  const name = license?.name || '';
  const url = license?.url || '';

  const isUrlValid = newUrl => {
    return validateUrl(newUrl, t, urlValidationOptions).validateStatus !== 'error';
  };

  const handleChange = newLicense => {
    onChange(newLicense, { isValid: isUrlValid(newLicense.url) });
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
      <Form.Item labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} label={t('common:url')} {...validateUrl(url, t, urlValidationOptions)}>
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
