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
    startPosition: 0,
    orientation: ORIENTATION.horizontal
  };
}

export function createInitialRevealEffect() {
  return {
    ...createDefaultRevealEffect(),
    startPosition: 10
  };
}

export function createDefaultClipEffect() {
  return {
    region: {
      x: 0,
      y: 0,
      width: 0,
      height: 0
    }
  };
}

export function createInitialClipEffect() {
  return {
    ...createDefaultClipEffect(),
    region: {
      x: 10,
      y: 10,
      width: 80,
      height: 80
    }
  };
}
