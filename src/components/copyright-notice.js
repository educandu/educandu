import React from 'react';
import PropTypes from 'prop-types';
import Markdown from './markdown.js';

function CopyrightNotice({ value }) {
  return !!value && (
    <div className="CopyrightNotice">
      <Markdown>{value}</Markdown>
    </div>
  );
}

CopyrightNotice.propTypes = {
  value: PropTypes.string
};

CopyrightNotice.defaultProps = {
  value: null
};

export default CopyrightNotice;
