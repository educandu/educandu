import React from 'react';
import PropTypes from 'prop-types';
import BreakIntoWords from './break-into-words.js';

function LiteralUrlLink({ href, targetBlank, ...rest }) {
  const attributes = targetBlank
    ? { ...rest, target: '_blank', rel: 'noopener noreferrer' }
    : rest;

  return (
    <a href={href} {...attributes}>
      <BreakIntoWords>{href}</BreakIntoWords>
    </a>
  );
}

LiteralUrlLink.propTypes = {
  href: PropTypes.string,
  targetBlank: PropTypes.bool
};

LiteralUrlLink.defaultProps = {
  href: '',
  targetBlank: false
};

export default LiteralUrlLink;
