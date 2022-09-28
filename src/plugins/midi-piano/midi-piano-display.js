import React from 'react';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import PianoComponent from './piano-component.js';
import { Button } from 'antd';

export default function MidiPianoDisplay({ content }) {

  const hasMidiFile = () => {
    if (content.sourceUrl === '') {
      return false;
    }
    return true;
  };

  return (
    <React.Fragment>
      {/* <div>{content.text}</div> */}
      <PianoComponent content={content} />
      {hasMidiFile() &&
        <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
          <Button>Play</Button>
          <Button>Pause</Button>
          <Button>Stop</Button>
        </div>}
    </React.Fragment>
  );
}

MidiPianoDisplay.propTypes = {
  ...sectionDisplayProps
};
