import React from 'react';
import PropTypes from 'prop-types';

function Tag({ value, canClose, onClose }) {
  return (
    <div className="Tag">
      <span>{value}</span>
      {canClose && <a className="Tag-close" onClick={onClose}>x</a>}
    </div>
  );
}

Tag.propTypes = {
  canClose: PropTypes.bool,
  onClose: PropTypes.func,
  value: PropTypes.node.isRequired
};

Tag.defaultProps = {
  canClose: false,
  onClose: () => {}
};

export default Tag;
