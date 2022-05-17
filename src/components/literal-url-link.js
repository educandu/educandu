import PropTypes from 'prop-types';
import React, { Fragment } from 'react';

const ZERO_WIDTH_SPACE = '\u200B';

function LiteralUrlLink({ href, targetBlank, ...rest }) {
  const parts = (href || '').replace(/[^\w]\b/g, c => `${c}${ZERO_WIDTH_SPACE}`).split(ZERO_WIDTH_SPACE);

  const attributes = targetBlank
    ? { ...rest, target: '_blank', rel: 'noopener noreferrer' }
    : rest;

  return (
    <a href={href} {...attributes}>
      {parts.map((part, index) => (
        <Fragment key={index.toString()}>
          {!!index && <wbr />}
          {part}
        </Fragment>
      ))}
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
