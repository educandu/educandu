import React from 'react';
import Markdown from '../../components/markdown.js';
import AbcNotation from '../../components/abc-notation.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

function AbcNotationDisplay({ content }) {
  return (
    <div className="AbcNotation">
      <div className={`AbcNotation-wrapper u-width-${content.width}`}>
        <AbcNotation abcCode={content.abcCode} displayMidi={content.displayMidi} />
        <div className="AbcNotation-copyrightInfo">
          <Markdown>{content.text}</Markdown>
        </div>
      </div>
    </div>
  );
}

AbcNotationDisplay.propTypes = {
  ...sectionDisplayProps
};

export default AbcNotationDisplay;
