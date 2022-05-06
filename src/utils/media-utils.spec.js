import { MEDIA_TYPE } from '../domain/constants.js';
import { formatMillisecondsAsDuration, getMediaType } from './media-utils.js';

describe('media-utils', () => {

  describe('getMediaType', () => {
    const testCases = [
      { url: '', expectedResult: MEDIA_TYPE.none },
      { url: 'file.unknown', expectedResult: MEDIA_TYPE.unknown },
      { url: 'file.aac', expectedResult: MEDIA_TYPE.audio },
      { url: 'file.m4a', expectedResult: MEDIA_TYPE.audio },
      { url: 'file.mp3', expectedResult: MEDIA_TYPE.audio },
      { url: 'file.oga', expectedResult: MEDIA_TYPE.audio },
      { url: 'file.ogg', expectedResult: MEDIA_TYPE.audio },
      { url: 'file.wav', expectedResult: MEDIA_TYPE.audio },
      { url: 'file.flac', expectedResult: MEDIA_TYPE.audio },
      { url: 'file.mp4', expectedResult: MEDIA_TYPE.video },
      { url: 'file.m4v', expectedResult: MEDIA_TYPE.video },
      { url: 'file.ogv', expectedResult: MEDIA_TYPE.video },
      { url: 'file.webm', expectedResult: MEDIA_TYPE.video },
      { url: 'file.mpg', expectedResult: MEDIA_TYPE.video },
      { url: 'file.mpeg', expectedResult: MEDIA_TYPE.video },
      { url: 'file.avi', expectedResult: MEDIA_TYPE.video },
      { url: 'file.mkv', expectedResult: MEDIA_TYPE.video },
      { url: 'file.MKV', expectedResult: MEDIA_TYPE.video }
    ];

    testCases.forEach(({ url, expectedResult }) => {
      describe(`called with url '${url}'`, () => {
        it(`should return '${expectedResult}'`, () => {
          expect(getMediaType(url)).toBe(expectedResult);
        });
      });
    });
  });

  describe('formatMillisecondsAsDuration', () => {
    const testCases = [
      { milliseconds: 0, expectedResult: '00:00' },
      { milliseconds: 1, expectedResult: '00:00' },
      { milliseconds: 10, expectedResult: '00:00' },
      { milliseconds: 100, expectedResult: '00:00' },
      { milliseconds: 1000, expectedResult: '00:01' },
      { milliseconds: 1001, expectedResult: '00:01' },
      { milliseconds: 503374, expectedResult: '08:23' },
      { milliseconds: 20547234, expectedResult: '05:42:27' },
      { milliseconds: 2349587234576232, expectedResult: '652663120:42:56' },
      { milliseconds: -100000, expectedResult: '00:00' },
      { milliseconds: Number.NaN, expectedResult: '00:00' },
      { milliseconds: Number.POSITIVE_INFINITY, expectedResult: '00:00' },
      { milliseconds: Number.NEGATIVE_INFINITY, expectedResult: '00:00' },
      { milliseconds: null, expectedResult: '00:00' }
    ];

    testCases.forEach(({ milliseconds, expectedResult }) => {
      describe(`called with milliseconds = ${milliseconds}`, () => {
        it(`should return '${expectedResult}'`, () => {
          expect(formatMillisecondsAsDuration(milliseconds)).toBe(expectedResult);
        });
      });
    });
  });

});
