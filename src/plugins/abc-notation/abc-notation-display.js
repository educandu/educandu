import React from 'react';
import Markdown from '../../components/markdown.js';
import AbcNotation from '../../components/abc-notation.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

function AbcNotationDisplay({ content }) {
  return (
    <div className="AbcNotation fa5">
      <div className={`AbcNotation-wrapper u-width-${content.width}`}>
        <AbcNotation abcCode={content.abcCode} displayMidi={content.displayMidi} />
        <div className="AbcNotation-copyrightNotice">
          <Markdown>{content.copyrightNotice}</Markdown>
        </div>
      </div>
    </div>
  );
}

AbcNotationDisplay.propTypes = {
  ...sectionDisplayProps
};

export default AbcNotationDisplay;
