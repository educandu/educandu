import React from 'react';
import AbcNotation from '../../components/abc-notation.js';
import CopyrightNotice from '../../components/copyright-notice.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

function AbcNotationDisplay({ content }) {
  return (
    <div className="AbcNotation">
      <div className={`AbcNotation-wrapper u-width-${content.width}`}>
        <AbcNotation abcCode={content.abcCode} displayMidi={content.displayMidi} />
        <CopyrightNotice value={content.copyrightNotice} />
      </div>
    </div>
  );
}

AbcNotationDisplay.propTypes = {
  ...sectionDisplayProps
};

export default AbcNotationDisplay;
