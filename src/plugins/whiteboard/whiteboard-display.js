import React, { useCallback } from 'react';
import { WhiteboardCanvas } from './whiteboard-canvas.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

const createInitialData = () => ({ canvasData: null });

export default function WhiteboardDisplay({ content, input, onInputChanged }) {
  const { width } = content;
  const data = input.data || createInitialData();

  const handleCanvasDataChange = useCallback(newCanvasData => {
    onInputChanged({ canvasData: newCanvasData });
  }, [onInputChanged]);

  return (
    <div className={`u-horizontally-centered u-width-${width}`}>
      <div style={{ width: '500px', height: '500px' }}>
        <WhiteboardCanvas data={data.canvasData} onChange={handleCanvasDataChange} />
      </div>
    </div>
  );
}

WhiteboardDisplay.propTypes = {
  ...sectionDisplayProps
};
