import React from 'react';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

function MultitrackMediaDisplay({ content }) {
  const { width, mainTrack, secondaryTracks } = content;

  return (
    <div className="MultitrackMediaDisplay">
      <div>Width: {width}</div>
      <div>{mainTrack.name}</div>
      {secondaryTracks.map(secondaryTrack => <div key={secondaryTrack.name}>{secondaryTrack.name}</div>)}
    </div>
  );
}

MultitrackMediaDisplay.propTypes = {
  ...sectionDisplayProps
};

export default MultitrackMediaDisplay;
