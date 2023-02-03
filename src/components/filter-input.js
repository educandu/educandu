import React from 'react';
import { Input } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import FilterIcon from './icons/general/filter-icon.js';

function FilterInput({ placeholder, ...props }) {
  const { t } = useTranslation('filterInput');

  const componentProps = { ...props };

  return (
    <Input
      {...componentProps}
      allowClear
      prefix={<FilterIcon />}
      placeholder={placeholder || t('common:filter')}
      />
  );
}

FilterInput.propTypes = {
  placeholder: PropTypes.string
};

FilterInput.defaultProps = {
  placeholder: null
};

export default FilterInput;
