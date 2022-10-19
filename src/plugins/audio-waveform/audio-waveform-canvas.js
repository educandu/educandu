import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';
import { drawWaveform } from './audio-waveform-utils.js';
import {
  DEFAULT_WAVEFORM_BACKGROUND_COLOR,
  DEFAULT_WAVEFORM_BASELINE_COLOR,
  DEFAULT_WAVEFORM_HEIGHT,
  DEFAULT_WAVEFORM_PEN_COLOR,
  DEFAULT_WAVEFORM_PEN_WIDTH,
  DEFAULT_WAVEFORM_SMOOTHING,
  DEFAULT_WAVEFORM_WIDTH
} from './constants.js';

const MOUSE_EVENT_BUTTON_PRIMARY = 0;
const MOUSE_EVENT_BUTTONS_PRIMARY = 1;

class Wavedrawer {
  constructor(element, options = {}) {
    const canvas = element.ownerDocument.createElement('canvas');
    canvas.setAttribute('style', 'display: block; cursor: crosshair;');
    element.replaceChildren(canvas);

    this._canvas = canvas;
    this._ctx = canvas.getContext('2d');

    this._options = {
      width: DEFAULT_WAVEFORM_WIDTH,
      height: DEFAULT_WAVEFORM_HEIGHT,
      penWidth: DEFAULT_WAVEFORM_PEN_WIDTH,
      smoothing: DEFAULT_WAVEFORM_SMOOTHING,
      penColor: DEFAULT_WAVEFORM_PEN_COLOR,
      baselineColor: DEFAULT_WAVEFORM_BASELINE_COLOR,
      backgroundColor: DEFAULT_WAVEFORM_BACKGROUND_COLOR,
      ...options
    };

    this._peaks = Array.from({ length: this._options.width }, () => 0);

    this._initCanvas();
    this._draw();
  }

  setOptions(options) {
    const newOptions = { ...this._options, ...options };
    const renderCriticalOptions = ['width', 'height', 'penColor', 'baselineColor', 'backgroundColor'];
    const needsRerendering = renderCriticalOptions.some(key => newOptions[key] !== this._options[key]);

    this._options = newOptions;

    if (this.width !== this._peaks.length) {
      // Adjust peaks array size to changed component width
      const oldPeaks = this._peaks;
      const factor = oldPeaks.length / this._options.width;
      const mapIndex = index => Math.max(0, Math.min(oldPeaks.length - 1, Math.round(index * factor)));
      this._peaks = Array.from({ length: this._options.width }, (_, index) => oldPeaks[mapIndex(index)]);
    }

    if (needsRerendering) {
      this._canvas.width = this._options.width;
      this._canvas.height = this._options.height;
      this._draw();
    }
  }

  clear() {
    this._peaks = Array.from({ length: this._options.width }, () => 0);
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
    const newPeakValue = Math.abs((this._options.height / 2) - canvasY) * 2 / this._options.height;

    const startX = Math.round(canvasX - (this._options.penWidth / 2));
    const stopX = startX + this._options.penWidth;

    for (let x = startX; x <= stopX; x += 1) {
      if (x > 0 && x < this._options.width) {
        this._peaks[x] = newPeakValue;
      }
    }

    if (this._options.smoothing) {
      if (startX > 0) {
        const oldPeakValue = this._peaks[startX - 1];
        this._peaks[startX - 1] = oldPeakValue + ((newPeakValue - oldPeakValue) / 2);
      }
      if (stopX < this._options.width) {
        const oldPeakValue = this._peaks[stopX + 1];
        this._peaks[stopX + 1] = oldPeakValue + ((newPeakValue - oldPeakValue) / 2);
      }
    }

    this._draw();
  }

  _draw() {
    drawWaveform({
      canvas: this._canvas,
      peaks: this._peaks,
      width: this._options.width,
      height: this._options.height,
      penColor: this._options.penColor,
      baselineColor: this._options.baselineColor,
      backgroundColor: this._options.backgroundColor
    });
  }
}

function AudioWaveformCanvas({ apiRef, backgroundColor, baselineColor, height, penColor, penWidth, smoothing, width }) {
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

AudioWaveformCanvas.propTypes = {
  apiRef: PropTypes.shape({ current: PropTypes.any }),
  backgroundColor: PropTypes.string,
  baselineColor: PropTypes.string,
  height: PropTypes.number,
  penColor: PropTypes.string,
  penWidth: PropTypes.number,
  smoothing: PropTypes.bool,
  width: PropTypes.number
};

AudioWaveformCanvas.defaultProps = {
  apiRef: null,
  backgroundColor: DEFAULT_WAVEFORM_BACKGROUND_COLOR,
  baselineColor: DEFAULT_WAVEFORM_BASELINE_COLOR,
  height: DEFAULT_WAVEFORM_HEIGHT,
  penColor: DEFAULT_WAVEFORM_PEN_COLOR,
  penWidth: DEFAULT_WAVEFORM_PEN_WIDTH,
  smoothing: DEFAULT_WAVEFORM_SMOOTHING,
  width: DEFAULT_WAVEFORM_WIDTH
};

export default AudioWaveformCanvas;
