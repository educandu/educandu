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

  const handleKeyUp = event => {
    if (event.key === 'Enter' && selectedItemKey) {
      onSelectionChange(selectedItemKey, true);
    }
  };

  const handleItemFocus = itemKey => {
    if (itemKey !== selectedItemKey) {
      onSelectionChange(itemKey, false);
    }
  };

  const handleItemDoubleClick = itemKey => {
    onSelectionChange(itemKey, true);
  };

  return (
    <ul
      ref={listRef}
      className="GridSelector"
      onKeyUp={handleKeyUp}
      >
      {items.map((item, index) => (
        <li
          key={item.key}
          tabIndex={index + 1}
          data-item-key={item.key}
          onFocus={() => handleItemFocus(item.key)}
          className={classNames('GridSelector-item', { 'is-selected': item.key === selectedItemKey })}
          onDoubleClick={() => handleItemDoubleClick(item.key)}
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
