import { fabric } from 'fabric';
import PropTypes from 'prop-types';
import deepEqual from 'fast-deep-equal';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useRef, useState } from 'react';
import { confirmWhiteboardReset } from '../../components/confirmation-dialogs.js';
import { FONT_SIZE, MODE, STROKE_WIDTH, TRANSPARENT_FILL_COLOR, WhiteboardToolbar } from './whiteboard-toolbar.js';
export function WhiteboardCanvas({ data, disabled, onChange }) {
  const parentRef = useRef();
  const canvasRef = useRef();
  const isLoadingData = useRef(false);
  const { t } = useTranslation('whiteboard');

  const [canvas, setCanvas] = useState();
  const [toolbarMode, setToolbarMode] = useState(MODE.select);
  const [fontSize, setFontSize] = useState(FONT_SIZE.medium);
  const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTH.medium);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [fillColor, setFillColor] = useState(TRANSPARENT_FILL_COLOR);

  useEffect(() => {
    if (!canvasRef.current || !parentRef.current) {
      return () => {};
    }

    const newCanvas = new fabric.Canvas(canvasRef.current, {
      selectionLineWidth: 2,
      isDrawingMode: false
    });

    setToolbarMode(MODE.select);

    const handleCanvasChange = () => {
      if (!isLoadingData.current) {
        const newCanvasData = newCanvas.toDatalessJSON();
        onChange(newCanvasData);
      }
    };

    newCanvas.on('object:added', handleCanvasChange);
    newCanvas.on('object:removed', handleCanvasChange);
    newCanvas.on('object:modified', handleCanvasChange);

    newCanvas.setHeight(parentRef.current?.clientHeight || 0);
    newCanvas.setWidth(parentRef.current?.clientWidth || 0);
    newCanvas.renderAll();

    const onKeydown = event => {
      if (!newCanvas) {
        return;
      }

      if (event.code === 'Delete' || event.code === 'Backspace') {
        const activeObjects = newCanvas.getActiveObjects();
        if (activeObjects.length && !activeObjects[0].isEditing) {
          newCanvas.remove(...activeObjects);
        }
      }
    };

    document.addEventListener('keydown', onKeydown, false);
    setCanvas(newCanvas);

    return () => {
      newCanvas.off('object:added', handleCanvasChange);
      newCanvas.off('object:removed', handleCanvasChange);
      newCanvas.off('object:modified', handleCanvasChange);

      document.removeEventListener('keydown', onKeydown, false);
      newCanvas.dispose();
    };
  }, [canvasRef, parentRef, disabled, onChange]);

  useEffect(() => {
    if (canvas?.getContext() && data && !deepEqual(data, canvas.toDatalessJSON())) {
      isLoadingData.current = true;
      canvas.loadFromJSON(data, () => {
        canvas.renderAll();
        isLoadingData.current = false;
      });
    }
  }, [canvas, data]);

  const handleToolbarModeChange = newToolbarMode => {
    setToolbarMode(newToolbarMode);

    if (newToolbarMode === MODE.select) {
      canvas.isDrawingMode = false;
      canvas.discardActiveObject().renderAll();
    }

    if (newToolbarMode === MODE.freeDraw) {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.width = strokeWidth;
      canvas.freeDrawingBrush.color = strokeColor;
    }
  };

  const handleTextClick = () => {
    setToolbarMode(MODE.select);
    canvas.isDrawingMode = false;

    const textbox = new fabric.Textbox(t('text'), {
      fill: strokeColor,
      fontSize
    });

    canvas.centerObject(textbox);
    canvas.add(textbox);
    canvas.renderAll();
  };

  const handleLineClick = () => {
    setToolbarMode(MODE.select);
    canvas.isDrawingMode = false;

    const line = new fabric.Line([50, 100, 200, 100], {
      strokeWidth,
      stroke: strokeColor
    });

    canvas.centerObject(line);
    canvas.add(line);
    canvas.renderAll();
  };

  const handleArrowClick = () => {
    setToolbarMode(MODE.select);
    canvas.isDrawingMode = false;

    const triangle = new fabric.Triangle({
      strokeWidth,
      stroke: strokeColor,
      fill: strokeColor,
      width: 10,
      height: 15,
      left: 235,
      top: 65,
      angle: 90
    });

    const line = new fabric.Line([50, 100, 200, 100], {
      strokeWidth,
      stroke: strokeColor,
      left: 75,
      top: 70
    });

    const arrow = new fabric.Group([line, triangle]);

    canvas.centerObject(arrow);
    canvas.add(arrow);
    canvas.renderAll();
  };

  const handleRectangleClick = () => {
    setToolbarMode(MODE.select);
    canvas.isDrawingMode = false;

    const rectangle = new fabric.Rect({
      strokeWidth,
      stroke: strokeColor,
      fill: fillColor,
      width: 100,
      height: 100
    });

    canvas.centerObject(rectangle);
    canvas.add(rectangle);
    canvas.renderAll();
  };

  const handleCircleClick = () => {
    setToolbarMode(MODE.select);
    canvas.isDrawingMode = false;

    const circle = new fabric.Circle({
      strokeWidth,
      stroke: strokeColor,
      fill: fillColor,
      radius: 70
    });

    canvas.centerObject(circle);
    canvas.add(circle);
    canvas.renderAll();
  };

  const handleTriangleClick = () => {
    setToolbarMode(MODE.select);
    canvas.isDrawingMode = false;

    const triangle = new fabric.Triangle({
      stroke: strokeColor,
      strokeWidth,
      fill: fillColor,
      width: 100,
      height: 100
    });

    canvas.centerObject(triangle);
    canvas.add(triangle);
    canvas.renderAll();
  };

  const handleEraseClick = () => {
    setToolbarMode(MODE.select);
    canvas.isDrawingMode = false;

    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length && !activeObjects[0].isEditing) {
      canvas.remove(...activeObjects);
    }
  };

  const handleFontSizeChange = newFontSize => {
    setFontSize(newFontSize);
    const activeObjects = canvas.getActiveObjects();

    if (activeObjects.length) {
      activeObjects.forEach(activeObject => {
        activeObject.set('fontSize', newFontSize);
      });
      canvas.renderAll();
    }
  };

  const handleStrokeWidthChange = newStrokeWidth => {
    setStrokeWidth(newStrokeWidth);
    const activeObjects = canvas.getActiveObjects();

    if (canvas.isDrawingMode) {
      canvas.freeDrawingBrush.width = newStrokeWidth;
    }

    if (activeObjects.length) {
      activeObjects.forEach(activeObject => {
        const isArrow = activeObject.type === 'group';
        if (isArrow) {
          activeObject.getObjects().forEach(arrowPart => {
            arrowPart.set('strokeWidth', newStrokeWidth);
          });
        } else if (activeObject.type !== 'textbox') {
          activeObject.set('strokeWidth', newStrokeWidth);
        }
      });
      canvas.renderAll();
    }
  };

  const handleStrokeColorChange = newStrokeColor => {
    setStrokeColor(newStrokeColor);
    const activeObjects = canvas.getActiveObjects();

    if (canvas.isDrawingMode) {
      canvas.freeDrawingBrush.color = newStrokeColor;
    }

    if (activeObjects.length) {
      activeObjects.forEach(activeObject => {
        const isArrow = activeObject.type === 'group';
        if (isArrow) {
          activeObject.getObjects().forEach(arrowPart => {
            arrowPart.set('stroke', newStrokeColor);
            if (arrowPart.type === 'triangle') {
              arrowPart.set('fill', newStrokeColor);
            }
          });
        } else if (activeObject.type === 'textbox') {
          activeObject.set('fill', newStrokeColor);
        } else {
          activeObject.set('stroke', newStrokeColor);
        }
      });
      canvas.renderAll();
    }
  };

  const handleFillColorChange = newFillColor => {
    setFillColor(newFillColor);

    const activeObjects = canvas.getActiveObjects();

    if (activeObjects.length) {
      activeObjects.forEach(activeObject => {
        if (activeObject.type !== 'textbox') {
          activeObject.set('fill', newFillColor);
        }
      });
      canvas.renderAll();
    }
  };

  const handleFillColorRemove = () => {
    handleFillColorChange(TRANSPARENT_FILL_COLOR);
  };

  const handleResetClick = () => {
    confirmWhiteboardReset(t, () => {
      canvas.clear();
    });
  };

  return (
    <div className="Whiteboard" ref={parentRef}>
      <div className="Whiteboard-canvasContainer">
        <canvas ref={canvasRef} className="canvas" />
      </div>

      {!disabled && (
        <WhiteboardToolbar
          mode={toolbarMode}
          fontSize={fontSize}
          strokeWidth={strokeWidth}
          strokeColor={strokeColor}
          fillColor={fillColor}
          onModeChange={handleToolbarModeChange}
          onTextClick={handleTextClick}
          onLineClick={handleLineClick}
          onArrowClick={handleArrowClick}
          onRectangleClick={handleRectangleClick}
          onTriangleClick={handleTriangleClick}
          onCircleClick={handleCircleClick}
          onEraseClick={handleEraseClick}
          onFontSizeChange={handleFontSizeChange}
          onStrokeWidthChange={handleStrokeWidthChange}
          onStrokeColorChange={handleStrokeColorChange}
          onFillColorChange={handleFillColorChange}
          onFillColorRemove={handleFillColorRemove}
          onResetClick={handleResetClick}
          />
      )}
    </div>
  );
}

WhiteboardCanvas.propTypes = {
  data: PropTypes.object,
  disabled: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired
};

WhiteboardCanvas.defaultProps = {
  data: null
};
