import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

function Tag({ value, isSelected, onDeselect }) {
  return (
    <div className={classNames('Tag', { 'is-selected': isSelected })}>
      <span>{value}</span>
      {isSelected && <a className="Tag-close" onClick={onDeselect}>x</a>}
    </div>
  );
}

Tag.propTypes = {
  isSelected: PropTypes.bool,
  onDeselect: PropTypes.func,
  value: PropTypes.node.isRequired
};

Tag.defaultProps = {
  isSelected: false,
  onDeselect: () => {}
};

export default Tag;
