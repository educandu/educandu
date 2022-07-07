import React from 'react';
import PropTypes from 'prop-types';

function InputAndPreview({ input, preview }) {
  return (
    <div className="InputAndPreview">
      <div className="InputAndPreview--input">{input}</div>
      <div className="InputAndPreview--preview">{preview}</div>
    </div>
  );
}

InputAndPreview.propTypes = {
  input: PropTypes.node,
  preview: PropTypes.node
};

InputAndPreview.defaultProps = {
  input: null,
  preview: null
};

export default InputAndPreview;
