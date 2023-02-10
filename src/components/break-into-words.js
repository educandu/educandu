import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import { ZERO_WIDTH_SPACE } from '../utils/string-utils.js';

function BreakIntoWords({ children }) {
  const parts = (children || '').replace(/[^\w]\b/g, c => `${c}${ZERO_WIDTH_SPACE}`).split(ZERO_WIDTH_SPACE);

  return (
    <Fragment>
      {parts.map((part, index) => (
        <Fragment key={index.toString()}>
          {!!index && <wbr />}
          {part}
        </Fragment>
      ))}
    </Fragment>
  );
}

BreakIntoWords.propTypes = {
  children: PropTypes.string
};

BreakIntoWords.defaultProps = {
  children: ''
};

export default BreakIntoWords;
