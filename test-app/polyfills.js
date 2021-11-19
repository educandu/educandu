/* eslint-disable capitalized-comments */

export const global = window;

// acho wants to have the global process object:
global.process = {
  title: 'elmu-web',
  env: {},
  argv: [],
  version: '',
  versions: {},
  on() {},
  addListener() {},
  once() {},
  off() {},
  removeListener() {},
  removeAllListeners() {},
  emit() {},
  prependListener() {},
  prependOnceListener() {},
  listeners() { return []; },
  binding() { throw new Error('process.binding is not supported'); },
  cwd() { return '/'; },
  chdir() { throw new Error('process.chdir is not supported'); },
  umask() { return 0; }
};

// and.design needs a buffer for Table -> rowSelection
global.Buffer = global.Buffer || require('buffer').Buffer;

// midi-js (dep of abcjs) wants to have the global MIDI object:
global.MIDI = {};
