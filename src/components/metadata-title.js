import React from 'react';
import PropTypes from 'prop-types';

function MetadataTitle({ text, extra }) {
  return (
    <div className="MetadataTitle">
      <h1 className="MetadataTitle-text">{text}</h1>
      {extra && <div className="MetadataTitle-extra">{extra}</div>}
    </div>
  );
}

MetadataTitle.propTypes = {
  extra: PropTypes.node,
  text: PropTypes.string
};

MetadataTitle.defaultProps = {
  extra: null,
  text: ''
};

export default MetadataTitle;
