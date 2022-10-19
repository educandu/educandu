import { IMAGE_SOURCE_TYPE } from '../../domain/constants.js';
import {
  DEFAULT_WAVEFORM_BACKGROUND_COLOR,
  DEFAULT_WAVEFORM_BASELINE_COLOR,
  DEFAULT_WAVEFORM_PEN_COLOR,
  DISPLAY_MODE
} from './constants.js';

export function getDefaultInteractivityConfig() {
  return {
    penColor: DEFAULT_WAVEFORM_PEN_COLOR,
    baselineColor: DEFAULT_WAVEFORM_BASELINE_COLOR,
    backgroundColor: DEFAULT_WAVEFORM_BACKGROUND_COLOR,
    opacityWhenResolved: 0.5
  };
}

export function getDefaultContent() {
  return {
    sourceType: IMAGE_SOURCE_TYPE.internal,
    sourceUrl: '',
    width: 100,
    displayMode: DISPLAY_MODE.static,
    interactivityConfig: getDefaultInteractivityConfig()
  };
}

export function drawWaveform({ canvas, peaks, width, height, penColor, baselineColor, backgroundColor }) {
  const context = canvas.getContext('2d');

  // Draw the background
  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, width, height);

  // Draw the waveform
  context.fillStyle = penColor;
  for (let x = 0; x < width; x += 1) {
    const blockHeight = Math.round(peaks[x] * height) || 0;
    const y = Math.round((height - blockHeight) / 2);
    context.fillRect(x, y, 1, blockHeight);
  }

  // Draw the baseline
  context.fillStyle = baselineColor;
  context.fillRect(0, Math.round(height / 2), width, 1);
}

export async function extractPeaks(audioFile, audioContext, length) {
  const arrayBuffer = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(audioFile);
  });

  const buffer = await audioContext.decodeAudioData(arrayBuffer);

  return Array.from({ length }, (_, slotIndex) => {
    let maxPeak = 0;
    for (let channelIndex = 0; channelIndex < buffer.numberOfChannels; channelIndex += 1) {
      const channelData = buffer.getChannelData(channelIndex);
      const samplesPerSlot = Math.ceil(channelData.length / length);
      for (let sampleIndex = 0; sampleIndex < samplesPerSlot; sampleIndex += 1) {
        maxPeak = Math.max(maxPeak, channelData[(slotIndex * samplesPerSlot) + sampleIndex]);
      }
    }
    return maxPeak;
  });
}

export function createWaveformImageUrl({ peaks, width, height, penColor, baselineColor, backgroundColor }) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('style', 'display: block;');
  canvas.width = width;
  canvas.height = height;

  drawWaveform({ canvas, peaks, width, height, penColor, baselineColor, backgroundColor });

  return canvas.toDataURL('image/png');
}
