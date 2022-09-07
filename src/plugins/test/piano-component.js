import React from 'react';
import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

export default function PianoComponent({ content }) {

  function playNote() {
    // eslint-disable-next-line no-console
    console.log('play');
  }

  function stopNote() {
    // eslint-disable-next-line no-console
    console.log('stop');
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <div style={{ paddingTop: '1rem', width: '100%', aspectRatio: '6/1' }}>
        <Piano
          noteRange={{ first: content.firstNote, last: content.lastNote }}
          // eslint-disable-next-line react/jsx-no-bind
          playNote={playNote}
          // eslint-disable-next-line react/jsx-no-bind
          stopNote={stopNote}
          />
      </div>
    </div>
  );
}

PianoComponent.propTypes = {
  ...sectionDisplayProps
};
