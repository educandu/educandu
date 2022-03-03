import React from 'react';
import PropTypes from 'prop-types';

function Title({ text }) {
  return (
    <h1 className="Title">{text}</h1>
  );
}

Title.propTypes = {
  text: PropTypes.string
};

Title.defaultProps = {
  text: ''
};

export default Title;
