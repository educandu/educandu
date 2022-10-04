import PropTypes from 'prop-types';
import { Piano } from 'react-piano';
import React, { useEffect, useState } from 'react';

export default function PianoComponent({ noteRange, playNote, stopNote, setActiveNotesInChildRef, keyWidthToHeight }) {

  const [activeNotes, setActiveNotes] = useState([]);

  const getNumberOfKeysRendered = () => {
    return noteRange.last - noteRange.first + 1;
  };

  const numberofKeysRendered = getNumberOfKeysRendered();

  let width;
  let height;
  const getWidthAndHeight = () => {
    if (numberofKeysRendered > 40) {
      width = 100;
      height = (400 / numberofKeysRendered).toFixed(2);
      return [width, height];
    }
    width = numberofKeysRendered * 2.5;
    height = 10;
    return [width, height];
  };

  const [divWidth, divHeight] = getWidthAndHeight();

  function setActiveNotesWrapper(eventType, midiValue) {

    setActiveNotes(prevArray => {
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
    // eslint-disable-next-line no-console
    console.log('setting setActiveNotesInChildRef.current');
    setActiveNotesInChildRef.current = setActiveNotesWrapper;
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <div style={{ paddingTop: '1rem', width: `${divWidth}%`, height: `${divHeight}rem` }}>
        <Piano
          noteRange={noteRange}
          playNote={playNote}
          stopNote={stopNote}
          activeNotes={activeNotes}
          />
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
