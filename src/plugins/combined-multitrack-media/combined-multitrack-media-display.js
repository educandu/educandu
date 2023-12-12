import React, {  } from 'react';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

function CombinedMultitrackMediaDisplay({ content }) {
  return (
    <pre>{JSON.stringify(content, null, 2)}</pre>
  );
}

CombinedMultitrackMediaDisplay.propTypes = {
  ...sectionDisplayProps
};

export default CombinedMultitrackMediaDisplay;
