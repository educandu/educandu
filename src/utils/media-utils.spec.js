import { getMediaType } from './media-utils.js';
import { MEDIA_TYPE } from '../domain/constants.js';

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
      { url: 'file.mkv', expectedResult: MEDIA_TYPE.video }
    ];

    testCases.forEach(({ url, expectedResult }) => {
      describe(`called with url '${url}'`, () => {
        it(`should return '${expectedResult}'`, () => {
          expect(getMediaType(url)).toBe(expectedResult);
        });
      });
    });
  });
});
