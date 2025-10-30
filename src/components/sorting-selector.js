import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Dropdown, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { SORTING_DIRECTION } from '../domain/constants.js';
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';

function SortingSelector({ sorting, options, size, onChange }) {
  const { t } = useTranslation('sortingSelector');

  const handleUpArrowClick = () => {
    onChange({ value: sorting.value, direction: 'desc' });
  };

  const handleDownArrowClick = () => {
    onChange({ value: sorting.value, direction: 'asc' });
  };

  const handleChange = ({ key }) => {
    onChange({ value: key, direction: sorting.direction });
  };

  const sortingSelectorClasses = classNames({
    'SortingSelector': true,
    'SortingSelector--small': size === 'small',
    'SortingSelector--large': size === 'large'
  });

  const items = options.map(option => ({
    key: option.value,
    label: option.label
  }));

  const selectedOption = options.find(option => option.value === sorting.value);

  return (
    <div className={sortingSelectorClasses}>
      <Dropdown trigger={['click']} menu={{ items, onClick: handleChange }}>
        <Tooltip placement="top" title={t('changeSortingValue')}>
          <a>{selectedOption.appliedLabel || selectedOption.label}</a>
        </Tooltip>
      </Dropdown>

      {sorting.direction === 'asc' && (
        <Tooltip placement="top" title={t('changeSortingDirectionDescending')}>
          <ArrowUpOutlined className="SortingSelector-direction" onClick={handleUpArrowClick} />
        </Tooltip>
      )}
      {sorting.direction === 'desc' && (
        <Tooltip placement="top" title={t('changeSortingDirectionAscending')}>
          <ArrowDownOutlined className="SortingSelector-direction" onClick={handleDownArrowClick} />
        </Tooltip>
      )}
    </div>
  );
}

SortingSelector.propTypes = {
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    appliedLabel: PropTypes.string,
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired
  })).isRequired,
  size: PropTypes.oneOf(['small', 'middle', 'large']),
  sorting: PropTypes.shape({
    value: PropTypes.string.isRequired,
    direction: PropTypes.oneOf(Object.values(SORTING_DIRECTION)).isRequired
  }).isRequired
};

SortingSelector.defaultProps = {
  size: 'middle'
};

export default SortingSelector;
