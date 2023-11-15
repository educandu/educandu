import React, { useState } from 'react';
import AbcPlayer from '../../components/abc-player.js';
import AbcNotation from '../../components/abc-notation.js';
import CopyrightNotice from '../../components/copyright-notice.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

function AbcNotationDisplay({ content }) {
  const [lastRenderResult, setLastRenderResult] = useState(null);

  return (
    <div className="AbcNotation">
      <div className={`AbcNotation-wrapper u-width-${content.width}`}>
        <AbcNotation abcCode={content.abcCode} onRender={setLastRenderResult} />
        <AbcPlayer renderResult={lastRenderResult} />
        <CopyrightNotice value={content.copyrightNotice} />
      </div>
    </div>
  );
}

AbcNotationDisplay.propTypes = {
  ...sectionDisplayProps
};

export default AbcNotationDisplay;
