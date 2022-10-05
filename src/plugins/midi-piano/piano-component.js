import PropTypes from 'prop-types';
import { Piano } from 'react-piano';
import React, { useEffect, useState, useRef } from 'react';

export default function PianoComponent({ noteRange, playNote, stopNote, setActiveNotesInChildRef }) {

  const [activeNotes, setActiveNotes] = useState([]);
  const containerDiv = useRef(null);
  const containerWidth = useRef(null);
  const pianoWrapperDiv = useRef(null);
  const pianoWrapperWidth = useRef(null);
  const renderPiano = useRef(false);
  const defaultKeyWidth = 29.2;

  function getNumberOfKeysRendered() {
    return noteRange.last - noteRange.first + 1;
  }

  const numberOfKeysRendered = getNumberOfKeysRendered();

  function setActiveNotesWrapper(eventType, midiValue) {
    setActiveNotes(prevArray => {
      if (midiValue === 0) {
        return [];
      }
      let array;
      let index;
      const prevNotes = [...prevArray];
      switch (eventType) {
        case 'Note on':
          array = [...prevArray];
          array.push(midiValue);
          break;
        case 'Note off':
          index = prevNotes.indexOf(midiValue);
          prevNotes.splice(index, 1);
          array = [...prevNotes];
          break;
        default:
          break;
      }
      return array;
    });
  }

  useEffect(() => {
    setActiveNotesInChildRef.current = setActiveNotesWrapper;
  }, []);

  const [pianoWrapperDimensions, setpianoWrapperDimensions] = useState({});

  const getWidthAndHeight = clientWidth => {
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

  useEffect(() => {
    if (!containerDiv.current.clientWidth || containerDiv.current.clientWidth === containerWidth.current) {
      return;
    }
    containerWidth.current = containerDiv.current.clientWidth;
    const obj = getWidthAndHeight(containerDiv.current.clientWidth);
    renderPiano.current = true;
    setpianoWrapperDimensions(obj);
  });

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
    const obj = getWidthAndHeight(containerDiv.current.clientWidth);
    setpianoWrapperDimensions(obj);
  };

  useEffect(() => {
    window.addEventListener('resize', handleWindowResize);
    return function cleanUp() {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  return (
    <div ref={containerDiv} style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <div ref={pianoWrapperDiv} style={{ paddingTop: '1rem', width: pianoWrapperDimensions.width || '100%', height: pianoWrapperDimensions.height || '160px' }}>
        {renderPiano.current
        && (<Piano
          noteRange={noteRange}
          playNote={playNote}
          stopNote={stopNote}
          activeNotes={activeNotes}
          />)}
      </div>
    </div>
  );
}

PianoComponent.propTypes = {
  noteRange: PropTypes.object.isRequired,
  playNote: PropTypes.func.isRequired,
  setActiveNotesInChildRef: PropTypes.object,
  stopNote: PropTypes.func.isRequired
};

PianoComponent.defaultProps = {
  setActiveNotesInChildRef: {}
};
