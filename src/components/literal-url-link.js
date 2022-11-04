import React from 'react';
import PropTypes from 'prop-types';
import LiteralUrl from './literal-url.js';

function LiteralUrlLink({ href, targetBlank, ...rest }) {
  const attributes = targetBlank
    ? { ...rest, target: '_blank', rel: 'noopener noreferrer' }
    : rest;

  return (
    <a href={href} {...attributes}>
      <LiteralUrl>{href}</LiteralUrl>
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
