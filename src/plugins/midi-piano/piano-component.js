import PropTypes from 'prop-types';
import { Piano } from 'react-piano';
import React, { useEffect, useState, useRef } from 'react';

export default function PianoComponent(props) {

  const defaultKeyWidth = 29.2;
  const renderCount = useRef(0);
  const renderPiano = useRef(false);
  const containerDiv = useRef(null);
  const containerWidth = useRef(null);
  const pianoWrapperDiv = useRef(null);
  const pianoWrapperWidth = useRef(null);
  const { noteRange, playNote, stopNote, keys } = props;
  const [pianoWrapperDimensions, setPianoWrapperDimensions] = useState({});

  function getNumberOfKeysRendered() {
    return noteRange.last - noteRange.first + 1;
  }

  const numberOfKeysRendered = getNumberOfKeysRendered();

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
    if (containerDiv.current.clientWidth === containerWidth.current) {
      return;
    }
    if (containerDiv.current.clientWidth < containerWidth.current && containerDiv.current.clientWidth > pianoWrapperWidth.current) {
      return;
    }
    if (containerDiv.current.clientWidth > containerWidth.current && neededWidth < containerDiv.current.clientWidth) {
      return;
    }
    const obj = getPianoWrapperDimensions(containerDiv.current.clientWidth);
    setPianoWrapperDimensions(obj);
  };

  useEffect(() => {
    renderCount.current += 1;
  });

  useEffect(() => {
    if (containerDiv.current.clientWidth === containerWidth.current) {
      return;
    }
    containerWidth.current = containerDiv.current.clientWidth;
    const obj = getPianoWrapperDimensions(containerDiv.current.clientWidth);
    renderPiano.current = true;
    setPianoWrapperDimensions(obj);
  });

  useEffect(() => {
    window.addEventListener('resize', handleWindowResize);
    return function cleanUp() {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  useEffect(() => {
    if (renderCount.current !== 2) {
      return;
    }
    const keyElems = document.querySelectorAll('.ReactPiano__Key');
    const midiValueStart = noteRange.first;
    let index = midiValueStart;
    for (const elem of keyElems) {
      keys.current[index] = elem;
      index += 1;
    }
  });

  return (
    <div ref={containerDiv} style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <div ref={pianoWrapperDiv} style={{ paddingTop: '1rem', width: pianoWrapperDimensions.width || '100%', height: pianoWrapperDimensions.height || '160px' }}>
        {renderPiano.current
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

