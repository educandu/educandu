import React from 'react';
import { Select } from 'antd';
import PropTypes from 'prop-types';
import prettyBytes from 'pretty-bytes';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../locale-context.js';
import { storagePlanShape } from '../../ui/default-prop-types.js';

function StoragePlanSelect({ storagePlans, value, onChange }) {
  const { locale } = useLocale();
  const { t } = useTranslation('storagePlanSelect');

  const options = storagePlans.map(plan => ({ label: plan.name, value: plan._id }));

  const renderOption = option => {
    const plan = storagePlans.find(p => p._id === option.value);

    return (
      <div key={plan._id}>
        <div>{plan.name}</div>
        <div className="StoragePlanSelect-size">{prettyBytes(plan.maxBytes, { locale })}</div>
      </div>
    );
  };

  return (
    <Select
      allowClear
      value={value}
      className="StoragePlanSelect"
      placeholder={t('selectPlan')}
      options={options}
      optionRender={renderOption}
      onChange={onChange}
      />
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
