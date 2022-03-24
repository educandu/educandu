import by from 'thenby';
import { Select } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { delay } from '../utils/time-utils.js';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useRef, useState } from 'react';

function TagSelector({ tags, selectedCount, onSelect, size }) {
  const relativeElemRef = useRef(null);
  const absoluteElemRef = useRef(null);
  const { t } = useTranslation('tagSelector');
  const [options, setOptions] = useState([]);
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

  useEffect(() => {
    setOptions(tags.map(tag => ({ label: tag, value: tag })).sort(by(tag => tag.label, { ignoreCase: true })));
  }, [tags]);

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

  const mainClasses = classNames({
    'TagSelector': true,
    'is-adding-subsequent-tag': !!selectedCount
  });

  const linkClasses = classNames({
    'TagSelector-link': true,
    'is-active': isActive
  });

  const linkText = selectedCount ? t('linkTextSelectMore') : t('linkTextSelectFirst');

  return (
    <div className={mainClasses} ref={relativeElemRef}>
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
  selectedCount: PropTypes.number.isRequired,
  size: PropTypes.oneOf(['small', 'middle', 'large']),
  tags: PropTypes.arrayOf(PropTypes.string).isRequired
};

TagSelector.defaultProps = {
  size: 'middle'
};

export default TagSelector;
