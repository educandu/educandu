import { getFileType } from './file-utils.js';
import { FILE_TYPE } from '../domain/constants.js';

describe('file-utils', () => {

  describe('getFileType', () => {
    const testCases = [
      { url: '', expectedResult: FILE_TYPE.none },
      { url: 'file', expectedResult: FILE_TYPE.none },
      { url: 'file.unknown', expectedResult: FILE_TYPE.unknown },
      { url: 'file.aac ', expectedResult: FILE_TYPE.audio },
      { url: 'file.something.aac ', expectedResult: FILE_TYPE.audio },
      { url: 'file.aac', expectedResult: FILE_TYPE.audio },
      { url: 'file.aac', expectedResult: FILE_TYPE.audio },
      { url: 'file.m4a', expectedResult: FILE_TYPE.audio },
      { url: 'file.mp3', expectedResult: FILE_TYPE.audio },
      { url: 'file.oga', expectedResult: FILE_TYPE.audio },
      { url: 'file.ogg', expectedResult: FILE_TYPE.audio },
      { url: 'file.wav', expectedResult: FILE_TYPE.audio },
      { url: 'file.flac', expectedResult: FILE_TYPE.audio },
      { url: 'file.mp4', expectedResult: FILE_TYPE.video },
      { url: 'file.m4v', expectedResult: FILE_TYPE.video },
      { url: 'file.ogv', expectedResult: FILE_TYPE.video },
      { url: 'file.webm', expectedResult: FILE_TYPE.video },
      { url: 'file.mpg', expectedResult: FILE_TYPE.video },
      { url: 'file.mpeg', expectedResult: FILE_TYPE.video },
      { url: 'file.avi', expectedResult: FILE_TYPE.video },
      { url: 'file.mkv', expectedResult: FILE_TYPE.video },
      { url: 'file.MKV', expectedResult: FILE_TYPE.video },
      { url: 'file.pdf', expectedResult: FILE_TYPE.pdf },
      { url: 'file.txt', expectedResult: FILE_TYPE.text },
      { url: 'file.doc', expectedResult: FILE_TYPE.text },
      { url: 'file.rtf', expectedResult: FILE_TYPE.text },
      { url: 'file.odt', expectedResult: FILE_TYPE.text },
      { url: 'file.jpg', expectedResult: FILE_TYPE.image },
      { url: 'file.jpeg', expectedResult: FILE_TYPE.image },
      { url: 'file.gif', expectedResult: FILE_TYPE.image },
      { url: 'file.png', expectedResult: FILE_TYPE.image },
      { url: 'file.tiff', expectedResult: FILE_TYPE.image },
      { url: 'file.raw', expectedResult: FILE_TYPE.image }
    ];

    testCases.forEach(({ url, expectedResult }) => {
      describe(`called with url '${url}'`, () => {
        it(`should return '${expectedResult}'`, () => {
          expect(getFileType(url)).toBe(expectedResult);
        });
      });
    });
  });
});
