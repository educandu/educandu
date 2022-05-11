import PropTypes from 'prop-types';
import React, { Fragment } from 'react';

const ZERO_WIDTH_SPACE = '\u200B';

function LiteralUrlLink({ href, ...rest }) {
  const parts = (href || '').replace(/[^\w]\b/g, c => `${c}${ZERO_WIDTH_SPACE}`).split(ZERO_WIDTH_SPACE);

  return (
    <a href={href} {...rest}>
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
  href: PropTypes.string
};

LiteralUrlLink.defaultProps = {
  href: ''
};

export default LiteralUrlLink;
