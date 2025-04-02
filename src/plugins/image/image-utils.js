import { HOVER_OR_REVEAL_ACTION, ORIENTATION } from './constants.js';

export function createDefaultHoverEffect() {
  return {
    sourceUrl: '',
    copyrightNotice: '',
    hoverAction: HOVER_OR_REVEAL_ACTION.switch
  };
}

export function createDefaultRevealEffect() {
  return {
    sourceUrl: '',
    copyrightNotice: '',
    revealAction: HOVER_OR_REVEAL_ACTION.switch,
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
