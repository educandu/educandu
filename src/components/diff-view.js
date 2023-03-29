import React from 'react';
import PropTypes from 'prop-types';
import { Diff, Hunk } from 'react-diff-view';
import { DIFF_TYPE } from '../utils/document-revision-comparison-utils.js';

function DiffView({ diff }) {
  return (
    <div className="DiffView">
      <Diff
        viewType="split"
        optimizeSelection
        hunks={diff.hunks}
        tokens={diff.tokens}
        diffType={diff.type}
        >
        {hunks => hunks.map(hunk => <Hunk key={hunk.content} hunk={hunk} />)}
      </Diff>
    </div>
  );
}

DiffView.propTypes = {
  diff: PropTypes.shape({
    hunks: PropTypes.arrayOf(PropTypes.object).isRequired,
    tokens: PropTypes.object.isRequired,
    type: PropTypes.oneOf(Object.values(DIFF_TYPE)).isRequired
  }).isRequired
};

export default DiffView;
