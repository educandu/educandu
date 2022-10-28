import React from 'react';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

// eslint-disable-next-line no-unused-vars
function MemoryDisplay({ content }) {
  return (
    <div>Memory display</div>
  );
}

MemoryDisplay.propTypes = {
  ...sectionDisplayProps
};

export default MemoryDisplay;
