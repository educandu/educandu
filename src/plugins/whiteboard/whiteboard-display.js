import React, { useCallback } from 'react';
import { WhiteboardCanvas } from './whiteboard-canvas.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

const createInitialData = () => ({ canvasData: null });

export default function WhiteboardDisplay({ content, input, canModifyInput, onInputChanged }) {
  const { width } = content;
  const data = input.data || createInitialData();

  const handleCanvasDataChange = useCallback(newCanvasData => {
    onInputChanged({ canvasData: newCanvasData });
  }, [onInputChanged]);

  return (
    <div className={`u-horizontally-centered u-width-${width}`}>
      <div style={{ width: '600px', height: '500px' }}>
        <WhiteboardCanvas
          data={data.canvasData}
          disabled={!canModifyInput}
          onChange={handleCanvasDataChange}
          />
      </div>
    </div>
  );
}

WhiteboardDisplay.propTypes = {
  ...sectionDisplayProps
};
