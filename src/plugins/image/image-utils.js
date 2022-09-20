import { ORIENTATION } from './constants.js';
import { IMAGE_SOURCE_TYPE } from '../../domain/constants.js';

export function createDefaultHoverEffect() {
  return {
    sourceType: IMAGE_SOURCE_TYPE.internal,
    sourceUrl: '',
    copyrightNotice: ''
  };
}

export function createDefaultRevealEffect() {
  return {
    sourceType: IMAGE_SOURCE_TYPE.internal,
    sourceUrl: '',
    copyrightNotice: '',
    startPosition: 10,
    orientation: ORIENTATION.horizontal
  };
}

export function createDefaultClipEffect() {
  return {
    region: {
      x: 10,
      y: 10,
      width: 80,
      height: 80
    }
  };
}
