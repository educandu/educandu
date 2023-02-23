import React from 'react';
import { Select } from 'antd';
import PropTypes from 'prop-types';
import prettyBytes from 'pretty-bytes';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../locale-context.js';
import { storagePlanShape } from '../../ui/default-prop-types.js';

const { Option } = Select;

function StoragePlanSelect({ storagePlans, value, onChange }) {
  const { locale } = useLocale();
  const { t } = useTranslation('storagePlanSelect');

  return (
    <Select
      allowClear
      value={value}
      className="StoragePlanSelect"
      placeholder={t('selectPlan')}
      onChange={onChange}
      >
      {storagePlans.map(plan => (
        <Option key={plan._id} value={plan._id} label={plan.name}>
          <div>
            <div>{plan.name}</div>
            <div className="StoragePlanSelect-size">{prettyBytes(plan.maxBytes, { locale })}</div>
          </div>
        </Option>
      ))}
    </Select>
  );
}

StoragePlanSelect.propTypes = {
  storagePlans: PropTypes.arrayOf(storagePlanShape),
  value: PropTypes.string,
  onChange: PropTypes.func
};

StoragePlanSelect.defaultProps = {
  storagePlans: [],
  value: null,
  onChange: () => {}
};

export default StoragePlanSelect;
