import React from 'react';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import PianoComponent from './piano-component.js';

export default function TestDisplay({ content }) {
  return (
    <React.Fragment>
      <div>{content.text}</div>
      <PianoComponent content={content} />
    </React.Fragment>
  );
}

TestDisplay.propTypes = {
  ...sectionDisplayProps
};
