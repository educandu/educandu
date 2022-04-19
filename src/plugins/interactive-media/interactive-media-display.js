import React from 'react';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

function InteractiveMediaDisplay({ content }) {
  return <div className="InteractiveMediaDisplay">Display - content: {JSON.stringify(content)}</div>;
}

InteractiveMediaDisplay.propTypes = {
  ...sectionDisplayProps
};

export default InteractiveMediaDisplay;
