import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Dropdown, Menu } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons';

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
        <span className="SortingSelector-text">
          {t('selectedValue', { value: selectedOption.label })}
        </span>
      </Dropdown>

      {direction === 'asc' && <CaretUpOutlined className="SortingSelector-direction" onClick={handleDirectionToggleClick} />}
      {direction === 'desc' && <CaretDownOutlined className="SortingSelector-direction" onClick={handleDirectionToggleClick} />}
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
