import { fabric } from 'fabric';
import PropTypes from 'prop-types';
import deepEqual from 'fast-deep-equal';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useRef, useState } from 'react';
import { confirmWhiteboardReset } from '../../components/confirmation-dialogs.js';
import { FONT_SIZES, MODES, STROKE_WIDTHS, WhiteboardToolbar } from './whiteboard-toolbar.js';

const transparentColor = 'rgba(255, 255, 255, 0.0)';
const getDefaultCanvasOptions = () => ({ selectionLineWidth: 2, isDrawingMode: false });

export function WhiteboardCanvas({ data, onChange }) {
  const parentRef = useRef();
  const canvasRef = useRef();
  const isLoadingData = useRef(false);
  const { t } = useTranslation('whiteboard');

  const [canvas, setCanvas] = useState();
  const [toolbarMode, setToolbarMode] = useState(MODES.select);
  const [fontSize, setFontSize] = useState(FONT_SIZES.medium);
  const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTHS.medium);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [fillColor, setFillColor] = useState(transparentColor);

  useEffect(() => {
    if (!canvasRef.current || !parentRef.current) {
      return () => {};
    }

    const newCanvas = new fabric.Canvas(canvasRef.current, getDefaultCanvasOptions);
    setToolbarMode(MODES.select);

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
        const activeObject = newCanvas.getActiveObject();
        if (activeObject) {
          newCanvas.remove(activeObject);
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
  }, [canvasRef, parentRef, onChange]);

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

    if (newToolbarMode === MODES.select) {
      canvas.isDrawingMode = false;
      canvas.discardActiveObject().renderAll();
    }

    if (newToolbarMode === MODES.freeDraw) {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.width = strokeWidth;
      canvas.freeDrawingBrush.color = strokeColor;
    }
  };

  const handleTextClick = () => {
    setToolbarMode(MODES.select);
    canvas.isDrawingMode = false;

    const textbox = new fabric.Textbox(t('text'), {
      fontSize
    });

    canvas.add(textbox);
    canvas.centerObject(textbox);
    canvas.renderAll();
  };

  const handleLineClick = () => {
    setToolbarMode(MODES.select);
    canvas.isDrawingMode = false;

    const line = new fabric.Line([50, 10, 200, 150], {
      strokeWidth,
      stroke: strokeColor,
      angle: 47
    });

    canvas.add(line);
    canvas.centerObject(line);
    canvas.renderAll();
  };

  const handleArrowClick = () => {
    setToolbarMode(MODES.select);
    canvas.isDrawingMode = false;

    const triangle = new fabric.Triangle({
      strokeWidth,
      stroke: strokeColor,
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
    canvas.add(arrow);
    canvas.centerObject(arrow);
    canvas.renderAll();
  };

  const handleRectangleClick = () => {
    setToolbarMode(MODES.select);
    canvas.isDrawingMode = false;

    const rectangle = new fabric.Rect({
      strokeWidth,
      stroke: strokeColor,
      fill: fillColor,
      width: 100,
      height: 100
    });

    canvas.add(rectangle);
    canvas.centerObject(rectangle);
    canvas.renderAll();
  };

  const handleCircleClick = () => {
    setToolbarMode(MODES.select);
    canvas.isDrawingMode = false;

    const circle = new fabric.Circle({
      strokeWidth,
      stroke: strokeColor,
      fill: fillColor,
      radius: 70
    });

    canvas.add(circle);
    canvas.centerObject(circle);
    canvas.renderAll();
  };

  const handleTriangleClick = () => {
    setToolbarMode(MODES.select);
    canvas.isDrawingMode = false;

    const triangle = new fabric.Triangle({
      stroke: strokeColor,
      strokeWidth,
      fill: fillColor,
      width: 100,
      height: 100
    });

    canvas.add(triangle);
    canvas.centerObject(triangle);
    canvas.renderAll();
  };

  const handleEraseClick = () => {
    setToolbarMode(MODES.select);
    canvas.isDrawingMode = false;

    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.remove(activeObject);
    }
  };

  const handleFontSizeChange = newFontSize => {
    setFontSize(newFontSize);
    const activeObject = canvas.getActiveObject();

    if (activeObject) {
      activeObject.set('fontSize', newFontSize);
      canvas.renderAll();
    }
  };

  const handleStrokeWidthChange = newStrokeWidth => {
    setStrokeWidth(newStrokeWidth);
    const activeObject = canvas.getActiveObject();

    if (canvas.isDrawingMode) {
      canvas.freeDrawingBrush.width = newStrokeWidth;
    }

    if (activeObject) {
      activeObject.set('strokeWidth', newStrokeWidth);
      canvas.renderAll();
    }
  };

  const handleStrokeColorChange = newStrokeColor => {
    setStrokeColor(newStrokeColor);
    const activeObject = canvas.getActiveObject();

    if (canvas.isDrawingMode) {
      canvas.freeDrawingBrush.color = newStrokeColor;
    }
    if (activeObject) {
      activeObject.set('stroke', newStrokeColor);
      canvas.renderAll();
    }
  };

  const handleFillColorChange = newFillColor => {
    setFillColor(newFillColor);

    const activeObject = canvas.getActiveObject();

    if (activeObject) {
      activeObject.set('fill', newFillColor);
      canvas.renderAll();
    }
  };

  const handleFillColorRemove = () => {
    handleFillColorChange(transparentColor);
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
    </div>
  );
}

WhiteboardCanvas.propTypes = {
  data: PropTypes.object,
  onChange: PropTypes.func.isRequired
};

WhiteboardCanvas.defaultProps = {
  data: null
};
