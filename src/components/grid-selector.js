import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

function GridSelector({ items, selectedItemKey, onSelectionChange }) {
  const listRef = useRef();

  useEffect(() => {
    const selectedElement = listRef.current?.querySelector(`[data-item-key="${selectedItemKey.replaceAll('"', '\\"')}"]`);
    if (selectedElement && selectedElement !== document.activeElement) {
      selectedElement.focus();
    }
  }, [selectedItemKey]);

  const handleFocusCapture = event => {
    const itemKey = event.target.getAttribute('data-item-key');
    if (itemKey && itemKey !== selectedItemKey) {
      onSelectionChange?.(itemKey, false);
    }
  };

  return (
    <ul ref={listRef} className="GridSelector" onFocusCapture={handleFocusCapture}>
      {items.map((item, index) => (
        <li
          key={item.key}
          tabIndex={index + 1}
          data-item-key={item.key}
          className={classNames('GridSelector-item', { 'GridSelector-item--selected': item.key === selectedItemKey })}
          onKeyUp={event => event.key === 'Enter' && onSelectionChange?.(item.key, true)}
          onDoubleClick={() => onSelectionChange?.(item.key, true)}
          >
          <div className="GridSelector-itemIcon">{item.icon}</div>
          <div className="GridSelector-itemLabel">{item.label}</div>
        </li>
      ))}
    </ul>
  );
}

GridSelector.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    icon: PropTypes.node,
    label: PropTypes.node
  })),
  onSelectionChange: PropTypes.func,
  selectedItemKey: PropTypes.string
};

GridSelector.defaultProps = {
  items: [],
  onSelectionChange: () => {},
  selectedItemKey: null
};

export default GridSelector;
