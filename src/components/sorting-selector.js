import PropTypes from 'prop-types';
import classNames from 'classnames';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown, Menu, Tooltip } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';

function SortingSelector({ initialValue, initialDirection, options, size, onChange }) {
  const { t } = useTranslation('sortingSelector');
  const [direction, setDirection] = useState(initialDirection);
  const [selectedOption, setSelectedOption] = useState(options.find(o => o.value === initialValue));

  const handleDirectionToggleClick = () => {
    const newDirection = direction === 'asc' ? 'desc' : 'asc';
    setDirection(newDirection);
    onChange({ value: selectedOption.value, direction: newDirection });
  };

  const handleChange = ({ key }) => {
    const newSelectedOption = options.find(option => option.value === key);
    setSelectedOption(newSelectedOption);
    onChange({ value: newSelectedOption.value, direction });
  };

  const sortingSelectorClasses = classNames({
    'SortingSelector': true,
    'SortingSelector--small': size === 'small',
    'SortingSelector--large': size === 'large'
  });

  const menu = (
    <Menu onClick={handleChange}>
      {options.map(option => <Menu.Item key={option.value}>{option.label}</Menu.Item>)}
    </Menu>
  );

  return (
    <div className={sortingSelectorClasses}>
      <Dropdown overlay={menu} trigger="click">
        <Tooltip placement="top" title={t('changeSortingValue')}>
          <a>{t('selectedValue', { value: selectedOption.label })}</a>
        </Tooltip>
      </Dropdown>

      <Tooltip placement="top" title={t('changeSortingDirection')}>
        {direction === 'asc' && <ArrowUpOutlined className="SortingSelector-direction" onClick={handleDirectionToggleClick} /> }
        {direction === 'desc' && <ArrowDownOutlined className="SortingSelector-direction" onClick={handleDirectionToggleClick} /> }
      </Tooltip>
    </div>
  );
}

SortingSelector.propTypes = {
  initialDirection: PropTypes.oneOf(['asc', 'desc']).isRequired,
  initialValue: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired
  })).isRequired,
  size: PropTypes.oneOf(['small', 'middle', 'large'])
};

SortingSelector.defaultProps = {
  size: 'middle'
};

export default SortingSelector;
