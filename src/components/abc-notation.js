import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';

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

function AbcNotation({ abcCode, displayMidi }) {
  const abcContainerRef = useRef(null);
  const midiContainerRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { default: abcjs } = await import('abcjs/midi.js');

      abcjs.renderAbc(abcContainerRef.current, abcCode, abcOptions);
      if (displayMidi) {
        abcjs.renderMidi(midiContainerRef.current, abcCode, midiOptions);
      }
    })();
  }, [abcCode, displayMidi]);

  return (
    <div className="AbcNotation">
      <div ref={abcContainerRef} />
      {displayMidi && <div ref={midiContainerRef} />}
    </div>
  );
}

AbcNotation.propTypes = {
  abcCode: PropTypes.string,
  displayMidi: PropTypes.bool
};

AbcNotation.defaultProps = {
  abcCode: '',
  displayMidi: false
};

export default AbcNotation;
