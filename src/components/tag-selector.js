import { Select } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { delay } from '../utils/time-utils.js';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useRef, useState } from 'react';

function TagSelector({ options, selectedCount, onSelect, size }) {
  const relativeElemRef = useRef(null);
  const absoluteElemRef = useRef(null);
  const { t } = useTranslation('tagSelector');
  const [isActive, setIsActive] = useState(false);
  const [selectLeftOffset, setSelectLeftOffset] = useState(0);

  useEffect(() => {
    if (relativeElemRef.current && absoluteElemRef.current && isActive) {
      const requiredWidth = relativeElemRef.current.offsetLeft + absoluteElemRef.current.clientWidth;
      const lackingWidth = requiredWidth - window.innerWidth;

      if (lackingWidth > 0) {
        setSelectLeftOffset(-lackingWidth - 5);
      } else {
        setSelectLeftOffset(0);
      }
    }
  }, [isActive]);

  const handleClick = () => {
    setIsActive(!isActive);
  };

  const handleChange = value => {
    onSelect(value);
    setIsActive(false);
  };

  const handleOnBlur = async () => {
    await delay(100);
    setIsActive(false);
  };

  const linkClasses = classNames({
    'TagSelector-link': true,
    'is-active': isActive
  });

  const linkText = selectedCount ? t('linkTextSelectMore') : t('linkTextSelectFirst');

  return (
    <div className="TagSelector" ref={relativeElemRef}>
      <a className={linkClasses} onClick={handleClick}>{linkText}</a>
      {isActive && (
        <div ref={absoluteElemRef} className="TagSelector-selectWrapper" style={{ left: selectLeftOffset }}>
          <Select
            className="TagSelector-select"
            autoFocus
            defaultOpen
            showSearch
            size={size}
            value={null}
            onBlur={handleOnBlur}
            options={options}
            onChange={handleChange}
            placeholder={t('searchPlaceholder')}
            />
        </div>)}
    </div>
  );
}

TagSelector.propTypes = {
  onSelect: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired
  })).isRequired,
  selectedCount: PropTypes.number.isRequired,
  size: PropTypes.oneOf(['small', 'middle', 'large'])
};

TagSelector.defaultProps = {
  size: 'middle'
};

export default TagSelector;
