import React from 'react';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

function MultitrackMediaDisplay({ content }) {
  const { width } = content;

  return (
    <div className="MultitrackMediaDisplay">
      {width}
    </div>
  );
}

MultitrackMediaDisplay.propTypes = {
  ...sectionDisplayProps
};

export default MultitrackMediaDisplay;
