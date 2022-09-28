import React from 'react';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import { Button } from 'antd';
// import PianoComponent from './piano-component.js';

export default function MidiPianoEditor({ content, onContentChanged }) {

  const handleClick = () => {
    onContentChanged({ ...content, text: new Date().toString() });
  };

  return (
    <div>
      <Button onClick={handleClick}>Click here </Button>
      {content.text}
      <div>{content.text}</div>
      {/* <PianoComponent content={content} /> */}
    </div>
  );
}

MidiPianoEditor.propTypes = {
  ...sectionEditorProps
};
