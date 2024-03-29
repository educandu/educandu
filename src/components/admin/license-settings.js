import PropTypes from 'prop-types';
import { Form, Input } from 'antd';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { settingsLicenseShape } from '../../ui/default-prop-types.js';
import { ADMIN_PAGE_FORM_ITEM_LAYOUT } from '../../domain/constants.js';

function LicenseSettings({ license, onChange }) {
  const { t } = useTranslation();

  const name = license?.name || '';
  const url = license?.url || '';

  const handleNameChange = event => {
    onChange({ name: event.target.value, url });
  };

  const handleUrlChange = event => {
    onChange({ name, url: event.target.value });
  };

  return (
    <div>
      <Form.Item {...ADMIN_PAGE_FORM_ITEM_LAYOUT} label={t('common:name')}>
        <Input value={name} onChange={handleNameChange} />
      </Form.Item>
      <Form.Item {...ADMIN_PAGE_FORM_ITEM_LAYOUT} label={t('common:url')}>
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
