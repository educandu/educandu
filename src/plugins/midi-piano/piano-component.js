import PropTypes from 'prop-types';
import { Piano } from 'react-piano';
import React, { useEffect, useState, useRef } from 'react';

export default function PianoComponent(props) {

  const defaultKeyWidth = 29.2;
  const pianoContainer = useRef(null);
  const containerWidth = useRef(null);
  const pianoWrapperWidth = useRef(null);
  const { noteRange, playNote, stopNote, keys } = props;
  const [canRenderPiano, setCanRenderPiano] = useState(false);
  const [pianoWrapperDimensions, setPianoWrapperDimensions] = useState({});

  function getNumberOfKeysRendered() {
    return noteRange.last - noteRange.first + 1;
  }

  const numberOfKeysRendered = getNumberOfKeysRendered();

  console.log('Render PIANO COMPONENT');

  const getPianoWrapperDimensions = clientWidth => {
    let width;
    let height;
    if (numberOfKeysRendered > 39) {
      width = clientWidth;
      const keyWidth = clientWidth / numberOfKeysRendered;
      height = keyWidth * 5.5;
      pianoWrapperWidth.current = width;
      return { width: `${width}px`, height: `${height}px` };
    }
    const neededWidth = numberOfKeysRendered * defaultKeyWidth;
    if (neededWidth > clientWidth) {
      width = clientWidth;
      const keyWidth = clientWidth / numberOfKeysRendered;
      height = keyWidth * 5.5;
    } else {
      height = 160;
      width = numberOfKeysRendered * defaultKeyWidth;
    }
    pianoWrapperWidth.current = width;
    return { width: `${width}px`, height: `${height}px` };
  };

  const handleWindowResize = () => {
    const neededWidth = numberOfKeysRendered * defaultKeyWidth;
    if (pianoContainer.current.clientWidth === containerWidth.current) {
      return;
    }
    if (pianoContainer.current.clientWidth < containerWidth.current && pianoContainer.current.clientWidth > pianoWrapperWidth.current) {
      return;
    }
    if (pianoContainer.current.clientWidth > containerWidth.current && neededWidth < pianoContainer.current.clientWidth) {
      return;
    }
    const obj = getPianoWrapperDimensions(pianoContainer.current.clientWidth);
    setPianoWrapperDimensions(obj);
  };

  useEffect(() => {
    if (pianoContainer.current.clientWidth === containerWidth.current) {
      return;
    }
    containerWidth.current = pianoContainer.current.clientWidth;
    const obj = getPianoWrapperDimensions(pianoContainer.current.clientWidth);
    setCanRenderPiano(true);
    setPianoWrapperDimensions(obj);
  });

  useEffect(() => {
    window.addEventListener('resize', handleWindowResize);
    return function cleanUp() {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  useEffect(() => {
    const keyElems = document.querySelectorAll('.ReactPiano__Key');
    const midiValueStart = noteRange.first;
    let index = midiValueStart;
    for (const elem of keyElems) {
      keys.current[index] = elem;
      index += 1;
    }
  });

  return (
    <div ref={pianoContainer} className="MidiPiano-pianoContainer">
      <div className="MidiPiano-pianoWrapper" style={{ width: pianoWrapperDimensions.width || '100%', height: pianoWrapperDimensions.height || '160px' }}>
        {canRenderPiano
        && (<Piano
          noteRange={noteRange}
          playNote={playNote}
          stopNote={stopNote}
          />)}
      </div>
    </div>
  );
}

PianoComponent.propTypes = {
  keys: PropTypes.object.isRequired,
  noteRange: PropTypes.object.isRequired,
  playNote: PropTypes.func.isRequired,
  stopNote: PropTypes.func.isRequired
};

