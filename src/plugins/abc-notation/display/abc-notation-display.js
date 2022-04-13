import React, { useEffect, useRef } from 'react';
import Markdown from '../../../components/markdown.js';
import { sectionDisplayProps } from '../../../ui/default-prop-types.js';

const abcOptions = {
  paddingtop: 0,
  paddingbottom: 0,
  paddingright: 0,
  paddingleft: 0,
  responsive: 'resize'
};

const midiOptions = {
  generateDownload: false,
  generateInline: true
};

function AbcNotationDisplay({ content }) {
  const abcContainerRef = useRef(null);
  const midiContainerRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { default: abcjs } = await import('abcjs/midi.js');

      abcjs.renderAbc(abcContainerRef.current, content.abcCode, abcOptions);
      abcjs.renderMidi(midiContainerRef.current, content.abcCode, midiOptions);
    })();
  });

  return (
    <div className="AbcNotation fa5">
      <div className={`AbcNotation-wrapper u-max-width-${content.maxWidth || 100}`}>
        <div ref={abcContainerRef} />
        {content.displayMidi && <div ref={midiContainerRef} />}
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
