import React from 'react';
import PropTypes from 'prop-types';

function MetadataTitle({ text }) {
  return (
    <h1 className="MetadataTitle">{text}</h1>
  );
}

MetadataTitle.propTypes = {
  text: PropTypes.string
};

MetadataTitle.defaultProps = {
  text: ''
};

export default MetadataTitle;
