import { describe, expect, it } from 'vitest';
import { getResourceType } from './resource-utils.js';
import { RESOURCE_TYPE } from '../domain/constants.js';

describe('resource-utils', () => {

  describe('getResourceType', () => {
    const testCases = [
      { url: '', expectedResult: RESOURCE_TYPE.none },
      { url: 'file', expectedResult: RESOURCE_TYPE.none },
      { url: 'file.unknown', expectedResult: RESOURCE_TYPE.unknown },
      { url: 'file.aac ', expectedResult: RESOURCE_TYPE.audio },
      { url: 'file.something.aac ', expectedResult: RESOURCE_TYPE.audio },
      { url: 'file.aac', expectedResult: RESOURCE_TYPE.audio },
      { url: 'file.aac', expectedResult: RESOURCE_TYPE.audio },
      { url: 'file.m4a', expectedResult: RESOURCE_TYPE.audio },
      { url: 'file.mp3', expectedResult: RESOURCE_TYPE.audio },
      { url: 'file.oga', expectedResult: RESOURCE_TYPE.audio },
      { url: 'file.ogg', expectedResult: RESOURCE_TYPE.audio },
      { url: 'file.wav', expectedResult: RESOURCE_TYPE.audio },
      { url: 'file.flac', expectedResult: RESOURCE_TYPE.audio },
      { url: 'file.mp4', expectedResult: RESOURCE_TYPE.video },
      { url: 'file.m4v', expectedResult: RESOURCE_TYPE.video },
      { url: 'file.ogv', expectedResult: RESOURCE_TYPE.video },
      { url: 'file.webm', expectedResult: RESOURCE_TYPE.video },
      { url: 'file.mpg', expectedResult: RESOURCE_TYPE.video },
      { url: 'file.mpeg', expectedResult: RESOURCE_TYPE.video },
      { url: 'file.avi', expectedResult: RESOURCE_TYPE.video },
      { url: 'file.mkv', expectedResult: RESOURCE_TYPE.video },
      { url: 'file.MKV', expectedResult: RESOURCE_TYPE.video },
      { url: 'file.pdf', expectedResult: RESOURCE_TYPE.pdf },
      { url: 'file.txt', expectedResult: RESOURCE_TYPE.text },
      { url: 'file.doc', expectedResult: RESOURCE_TYPE.text },
      { url: 'file.rtf', expectedResult: RESOURCE_TYPE.text },
      { url: 'file.odt', expectedResult: RESOURCE_TYPE.text },
      { url: 'file.jpg', expectedResult: RESOURCE_TYPE.image },
      { url: 'file.jpeg', expectedResult: RESOURCE_TYPE.image },
      { url: 'file.gif', expectedResult: RESOURCE_TYPE.image },
      { url: 'file.png', expectedResult: RESOURCE_TYPE.image },
      { url: 'file.tiff', expectedResult: RESOURCE_TYPE.image },
      { url: 'file.raw', expectedResult: RESOURCE_TYPE.image },
      { url: 'file.svg', expectedResult: RESOURCE_TYPE.image }
    ];

    testCases.forEach(({ url, expectedResult }) => {
      describe(`called with url '${url}'`, () => {
        it(`should return '${expectedResult}'`, () => {
          expect(getResourceType(url)).toBe(expectedResult);
        });
      });
    });
  });
});
