import React from 'react';
import PropTypes from 'prop-types';

export default function LanguageIcon({ language }) {
  return <div className="LanguageIcon">{language.toUpperCase()}</div>;
}

LanguageIcon.propTypes = {
  language: PropTypes.string.isRequired
};
