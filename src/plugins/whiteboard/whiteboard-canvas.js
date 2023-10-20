import { Modal } from 'antd';
import { fabric } from 'fabric';
import PropTypes from 'prop-types';
import deepEqual from 'fast-deep-equal';
import LineIcon from './icons/line-icon.js';
import DrawIcon from './icons/draw-icon.js';
import TextIcon from './icons/text-icon.js';
import ShapeIcon from './icons/shape-icon.js';
import ArrowIcon from './icons/arrow-icon.js';
import CircleIcon from './icons/circle-icon.js';
import SelectIcon from './icons/select-icon.js';
import EraserIcon from './icons/eraser-icon.js';
import { UndoOutlined } from '@ant-design/icons';
import TriangleIcon from './icons/triangle-icon.js';
import RectangleIcon from './icons/rectangle-icon.js';
import { RgbaStringColorPicker } from 'react-colorful';
import WhiteboardDropdown from './whiteboard-dropdown.js';
import React, { useEffect, useRef, useState } from 'react';

const canvasOptions = { selectionLineWidth: 2, isDrawingMode: false };

export function WhiteboardCanvas({ data, onChange }) {
  const parentRef = useRef();
  const canvasRef = useRef();
  const isLoadingData = useRef(false);
  const [canvas, setCanvas] = useState();

  const [objOptions, setObjOptions] = useState({
    stroke: '#000000', fontSize: 22, fill: 'rgba(255, 255, 255, 0.0)', strokeWidth: 3
  });

  const [colorProp, setColorProp] = useState('background');

  useEffect(() => {
    if (!canvasRef.current || !parentRef.current) {
      return () => {};
    }

    const newCanvas = new fabric.Canvas(canvasRef.current, canvasOptions);

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

  const onRadioColor = e => {
    setColorProp(e.target.value);
  };

  const onColorChange = value => {
    const activeObj = canvas.getActiveObject();

    if (canvas.isDrawingMode) {
      canvas.freeDrawingBrush.color = value;
    }
    if (activeObj) {
      activeObj.set(colorProp, value);
      const ops = { ...objOptions, [colorProp]: value };
      setObjOptions(ops);
      canvas.renderAll();
    } else if (colorProp === 'backgroundColor') {
      canvas.backgroundColor = value;
      canvas.renderAll();
    }
  };

  const onOptionsChange = e => {
    let val = e.target.value;
    const name = e.target.name;
    const activeObj = canvas.getActiveObject();

    if (canvas.isDrawingMode && name === 'strokeWidth') {
      canvas.freeDrawingBrush.width = val;
    }

    if (activeObj) {
      val = isNaN(val) ? val : Number(val);
      activeObj.set(name, val);

      const ops = { ...objOptions, [name]: val };
      setObjOptions(ops);
      canvas.renderAll();
    }
  };

  const onZoom = e => {
    canvas.zoomToPoint(new fabric.Point(canvas.width / 2, canvas.height / 2), Number(e.target.value));
    const units = 10;
    const delta = new fabric.Point(units, 0);
    canvas.relativePan(delta);

    e.preventDefault();
    e.stopPropagation();
  };

  const handleSelectClick = () => {
    canvas.isDrawingMode = false;
    canvas.discardActiveObject().renderAll();
  };
  const handleDrawClick = () => {
    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush.width = 5;
    canvas.freeDrawingBrush.color = '#000000';
  };
  const handleTextClick = () => {
    canvas.isDrawingMode = false;
    const textbox = new fabric.Textbox('Your text here', { fontSize: objOptions.fontSize });
    canvas.add(textbox);
    canvas.centerObject(textbox);
    canvas.renderAll();
  };
  const handleLineClick = () => {
    canvas.isDrawingMode = false;
    const line = new fabric.Line([50, 10, 200, 150], { ...objOptions, angle: 47 });
    canvas.add(line);
    canvas.centerObject(line);
    canvas.renderAll();
  };
  const handleArrowClick = () => {
    canvas.isDrawingMode = false;
    const triangle = new fabric.Triangle({
      ...objOptions,
      width: 10,
      height: 15,
      left: 235,
      top: 65,
      angle: 90
    });

    const line = new fabric.Line([50, 100, 200, 100], { ...objOptions, left: 75, top: 70 });
    const arrow = new fabric.Group([line, triangle]);
    canvas.add(arrow);
    canvas.centerObject(arrow);
    canvas.renderAll();
  };
  const handleRectangleClick = () => {
    canvas.isDrawingMode = false;
    const rectangle = new fabric.Rect({ ...objOptions, width: 100, height: 100 });
    canvas.add(rectangle);
    canvas.centerObject(rectangle);
    canvas.renderAll();
  };
  const handleCircleClick = () => {
    canvas.isDrawingMode = false;
    const circle = new fabric.Circle({ ...objOptions, radius: 70 });
    canvas.add(circle);
    canvas.centerObject(circle);
    canvas.renderAll();
  };
  const handleTriangleClick = () => {
    canvas.isDrawingMode = false;
    const triangle = new fabric.Triangle({ ...objOptions, width: 100, height: 100 });
    canvas.add(triangle);
    canvas.centerObject(triangle);
    canvas.renderAll();
  };
  const handleEraseClick = () => {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.remove(activeObject);
    }
  };
  const handleClearClick = () => {
    Modal.confirm({
      title: 'Are you sure to reset the whiteboard?',
      onOk: () => {
        canvas.clear();
      }
    });
  };

  return (
    <div
      className="w-100 h-100 Whiteboard"
      ref={parentRef}
      >

      <div className="left-menu">
        <div className="bg-white d-flex align-center justify-between shadow br-7">
          <label>Font size</label>
          <input type="number" min="1" name="fontSize" onChange={onOptionsChange} defaultValue="22" />
        </div>

        <div className="bg-white d-flex align-center justify-between shadow br-7">
          <label>Stroke</label>
          <input type="number" min="1" name="strokeWidth" onChange={onOptionsChange} defaultValue="3" />
        </div>

        <div className="bg-white d-flex flex-column shadow br-7">
          <div className="d-flex align-end mb-10">
            <input className="mr-10" type="radio" onChange={onRadioColor} name="color" defaultValue="backgroundColor" />
            <label htmlFor="backgroundColor">background</label>
          </div>
          <div className="d-flex align-end mb-10">
            <input className="mr-10" type="radio" onChange={onRadioColor} id="stroke" name="color" defaultValue="stroke" />
            <label htmlFor="stroke">stroke</label>
          </div>

          <div className="d-flex align-end mb-10">
            <input className="mr-10" type="radio" onChange={onRadioColor} id="fill" name="color" defaultValue="fill" />
            <label htmlFor="fill">fill</label>
          </div>

          <RgbaStringColorPicker onChange={onColorChange} />
        </div>
      </div>

      <div className="w-100 d-flex justify-center align-center" style={{ position: 'fixed', top: '10px', left: 0, zIndex: 9999 }}>
        <div className="bg-white d-flex justify-center align-center shadow br-7">
          <button type="button" onClick={handleSelectClick}><SelectIcon /></button>
          <button type="button" onClick={handleDrawClick}><DrawIcon /></button>
          <button type="button" onClick={handleTextClick}><TextIcon /></button>
          <WhiteboardDropdown title={<ShapeIcon />}>
            <button type="button" onClick={handleLineClick}><LineIcon /></button>
            <button type="button" onClick={handleArrowClick}><ArrowIcon /></button>
            <button type="button" onClick={handleRectangleClick}><RectangleIcon /></button>
            <button type="button" onClick={handleCircleClick}><CircleIcon /></button>
            <button type="button" onClick={handleTriangleClick}><TriangleIcon /></button>
          </WhiteboardDropdown>
          <button type="button" onClick={handleEraseClick}><EraserIcon /></button>
          <button type="button" onClick={handleClearClick}><UndoOutlined /></button>
        </div>
      </div>

      <canvas ref={canvasRef} className="canvas" />

      <div className="w-100 bottom-menu">
        <select className="d-flex align-center bg-white br-7 shadow border-0 pr-1 pl-1" onChange={onZoom} defaultValue="1">
          <option value="2">200%</option>
          <option value="1.5">150%</option>
          <option value="1">100%</option>
          <option value="0.75">75%</option>
          <option value="0.50">50%</option>
          <option value="0.25">25%</option>
        </select>
      </div>
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
