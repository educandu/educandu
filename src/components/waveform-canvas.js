import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';
import { IMAGE_OPTIMIZATION_THRESHOLD_WIDTH } from '../domain/constants.js';

const DEFAULT_OPTIONS = {
  width: IMAGE_OPTIMIZATION_THRESHOLD_WIDTH,
  height: Math.round(IMAGE_OPTIMIZATION_THRESHOLD_WIDTH / 2.5),
  penWidth: 2,
  smoothing: true,
  penColor: '#666666',
  baselineColor: '#333333',
  backgroundColor: '#eeeeee'
};

const MOUSE_EVENT_BUTTON_PRIMARY = 0;
const MOUSE_EVENT_BUTTONS_PRIMARY = 1;

class Wavedrawer {
  constructor(element, options = {}) {
    const canvas = element.ownerDocument.createElement('canvas');
    canvas.setAttribute('style', 'display: block;');
    element.replaceChildren(canvas);

    this._canvas = canvas;
    this._ctx = canvas.getContext('2d');
    this._options = { ...DEFAULT_OPTIONS, ...options };
    this._values = Array.from({ length: this._options.width }, () => 0);

    this._initCanvas();
    this._draw();
  }

  setOptions(options) {
    const newOptions = { ...this._options, ...options };
    const renderCriticalOptions = ['width', 'height', 'penColor', 'baselineColor', 'backgroundColor'];
    const needsRerendering = renderCriticalOptions.some(key => newOptions[key] !== this._options[key]);

    this._options = newOptions;

    if (this.width !== this._values.length) {
      // Adjust values array size to changed width
      const oldValues = this._values;
      const factor = oldValues.length / this._options.width;
      const mapIndex = index => Math.max(0, Math.min(oldValues.length - 1, Math.round(index * factor)));
      this._values = Array.from({ length: this._options.width }, (_, index) => oldValues[mapIndex(index)]);
    }

    if (needsRerendering) {
      this._canvas.width = this._options.width;
      this._canvas.height = this._options.height;
      this._draw();
    }
  }

  clear() {
    this._values = Array.from({ length: this._options.width }, () => 0);
    this._draw();
  }

  destroy() {
    this._canvas.onmousedown = null;
    this._canvas.onmousemove = null;
    this._canvas.remove();
    this._canvas = null;
    this._ctx = null;
  }

  _initCanvas() {
    this._canvas.width = this._options.width;
    this._canvas.height = this._options.height;
    this._canvas.onmousedown = event => {
      if (event.button === MOUSE_EVENT_BUTTON_PRIMARY) {
        this._handleUserDraw(event.offsetX, event.offsetY);
      }
    };
    this._canvas.onmousemove = event => {
      if (event.buttons === MOUSE_EVENT_BUTTONS_PRIMARY) {
        this._handleUserDraw(event.offsetX, event.offsetY);
      }
    };
  }

  _handleUserDraw(canvasX, canvasY) {
    const newValue = Math.abs((this._options.height / 2) - canvasY) * 2 / this._options.height;

    const startX = Math.round(canvasX - (this._options.penWidth / 2));
    const stopX = startX + this._options.penWidth;

    for (let x = startX; x <= stopX; x += 1) {
      if (x > 0 && x < this._options.width) {
        this._values[x] = newValue;
      }
    }

    if (this._options.smoothing) {
      if (startX > 0) {
        const oldValue = this._values[startX - 1];
        this._values[startX - 1] = oldValue + ((newValue - oldValue) / 2);
      }
      if (stopX < this._options.width) {
        const oldValue = this._values[stopX + 1];
        this._values[stopX + 1] = oldValue + ((newValue - oldValue) / 2);
      }
    }

    this._draw();
  }

  _draw() {
    // Draw the background
    this._ctx.fillStyle = this._options.backgroundColor;
    this._ctx.fillRect(0, 0, this._options.width, this._options.height);

    // Draw the waveform
    this._ctx.fillStyle = this._options.penColor;
    for (let x = 0; x < this._options.width; x += 1) {
      const blockHeight = Math.round(this._values[x] * this._options.height) || 0;
      const y = Math.round((this._options.height - blockHeight) / 2);
      this._ctx.fillRect(x, y, 1, blockHeight);
    }

    // Draw the baseline
    this._ctx.fillStyle = this._options.baselineColor;
    this._ctx.fillRect(0, Math.round(this._options.height / 2), this._options.width, 1);
  }
}

function WaveformCanvas({ apiRef, backgroundColor, baselineColor, height, penColor, penWidth, smoothing, width }) {
  const containerRef = useRef();
  const wavedrawerRef = useRef();

  useEffect(() => {
    const options = { width, height, penWidth, smoothing, penColor, baselineColor, backgroundColor };
    if (wavedrawerRef.current) {
      wavedrawerRef.current.setOptions(options);
    } else {
      wavedrawerRef.current = new Wavedrawer(containerRef.current, options);
      if (apiRef) {
        apiRef.current = wavedrawerRef.current;
      }
    }
  }, [containerRef, wavedrawerRef, apiRef, backgroundColor, baselineColor, height, penColor, penWidth, smoothing, width]);

  useEffect(() => {
    return () => wavedrawerRef.current.destroy();
  }, [wavedrawerRef]);

  return (
    <div ref={containerRef} />
  );
}

WaveformCanvas.propTypes = {
  apiRef: PropTypes.shape({ current: PropTypes.any }),
  backgroundColor: PropTypes.string,
  baselineColor: PropTypes.string,
  height: PropTypes.number,
  penColor: PropTypes.string,
  penWidth: PropTypes.number,
  smoothing: PropTypes.bool,
  width: PropTypes.number
};

WaveformCanvas.defaultProps = {
  apiRef: null,
  backgroundColor: DEFAULT_OPTIONS.backgroundColor,
  baselineColor: DEFAULT_OPTIONS.baselineColor,
  height: DEFAULT_OPTIONS.height,
  penColor: DEFAULT_OPTIONS.penColor,
  penWidth: DEFAULT_OPTIONS.penWidth,
  smoothing: DEFAULT_OPTIONS.smoothing,
  width: DEFAULT_OPTIONS.width
};

export default WaveformCanvas;
