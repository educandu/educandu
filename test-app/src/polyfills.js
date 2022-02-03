/* eslint-disable capitalized-comments */

export const global = window;

// midi-js (dep of abcjs) wants to have the global MIDI object:
global.MIDI = {};
