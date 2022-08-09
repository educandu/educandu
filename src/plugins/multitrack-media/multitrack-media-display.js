import React from 'react';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

function MultitrackMediaDisplay({ content }) {
  const { width, mainTrack, secondaryTracks } = content;

  return (
    <div className="MultitrackMediaDisplay">
      <div>{JSON.stringify(mainTrack).replaceAll(',', ', ')}</div>
      <div>Width: {width}</div>
      {secondaryTracks.map((secondaryTrack, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={index}>
          <hr />
          <div>{JSON.stringify(secondaryTrack).replaceAll(',', ', ')}</div>
        </div>
      ))}
    </div>
  );
}

MultitrackMediaDisplay.propTypes = {
  ...sectionDisplayProps
};

export default MultitrackMediaDisplay;
