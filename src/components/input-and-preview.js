import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

function InputAndPreview({ input, preview, inline }) {

  const previewClasses = classNames(
    'InputAndPreview-preview',
    { 'InputAndPreview-preview--inline': inline }
  );
  return (
    <div className="InputAndPreview">
      <div className="InputAndPreview-input">{input}</div>
      <div className={previewClasses}>{preview}</div>
    </div>
  );
}

InputAndPreview.propTypes = {
  inline: PropTypes.bool,
  input: PropTypes.node,
  preview: PropTypes.node
};

InputAndPreview.defaultProps = {
  inline: false,
  input: null,
  preview: null
};

export default InputAndPreview;
