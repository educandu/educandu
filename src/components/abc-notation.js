import abcjs from 'abcjs';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import MediaPlayer from './media-player/media-player.js';
import { MEDIA_SCREEN_MODE } from '../domain/constants.js';
import React, { useEffect, useRef, useState } from 'react';

const abcOptions = {
  paddingtop: 0,
  // Sometimes ABC renders outside on the bottom, so we add some extra space
  paddingbottom: 10,
  paddingright: 0,
  paddingleft: 0,
  responsive: 'resize'
};

function AbcNotation({ abcCode, displayMidi, hideNotes }) {
  const abcContainerRef = useRef(null);
  const [renderResult, setRenderResult] = useState(null);
  const [audioUrlGenerator, setAudioUrlGenerator] = useState(null);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState(null);

  useEffect(() => {
    const renderTarget = hideNotes ? '*' : abcContainerRef.current;
    const visualObj = abcjs.renderAbc(renderTarget, abcCode, abcOptions);
    const newRenderResult = visualObj[0];
    setRenderResult(newRenderResult);
    setGeneratedAudioUrl(null);
    setAudioUrlGenerator({
      generate: async () => {
        const midiBuffer = new abcjs.synth.CreateSynth();

        await midiBuffer.init({
          visualObj: newRenderResult,
          millisecondsPerMeasure: newRenderResult.millisecondsPerMeasure()
        });

        await midiBuffer.prime();

        // This is necessary to make the audio file download work!
        midiBuffer.start();
        midiBuffer.stop();

        const soundUrl = midiBuffer.download();

        setGeneratedAudioUrl(soundUrl);
        return soundUrl;
      }
    });
  }, [abcContainerRef, abcCode, displayMidi, hideNotes]);

  useEffect(() => {
    return () => {
      if (generatedAudioUrl) {
        URL.revokeObjectURL(generatedAudioUrl);
      }
    };
  }, [generatedAudioUrl]);

  return (
    <div className="AbcNotation">
      {!hideNotes && <div className="AbcNotation-notes" ref={abcContainerRef} />}
      {displayMidi && renderResult && (
        <div className={classNames('AbcNotation-audio', { 'AbcNotation-audio--audioOnly': hideNotes })}>
          <MediaPlayer
            source={audioUrlGenerator?.generate || null}
            screenMode={MEDIA_SCREEN_MODE.none}
            downloadFileName="download.wav"
            canDownload
            />
        </div>
      )}
    </div>
  );
}

AbcNotation.propTypes = {
  abcCode: PropTypes.string,
  displayMidi: PropTypes.bool,
  hideNotes: PropTypes.bool
};

AbcNotation.defaultProps = {
  abcCode: '',
  displayMidi: false,
  hideNotes: false
};

export default AbcNotation;
