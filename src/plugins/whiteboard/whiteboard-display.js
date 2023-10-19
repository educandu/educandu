import React from 'react';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

const createInitialData = () => ({});

export default function WhiteboardDisplay({ content, input, canModifyInput, onInputChanged }) {
  const { width } = content;
  const data = input.data || createInitialData();

  // eslint-disable-next-line no-unused-vars
  const handleDataChange = newData => {
    onInputChanged(newData);
  };

  return (
    <div className={`u-horizontally-centered u-width-${width}`}>
      <pre>
        {JSON.stringify({ data, canModifyInput }, null, 2)}
      </pre>
    </div>
  );
}

WhiteboardDisplay.propTypes = {
  ...sectionDisplayProps
};
