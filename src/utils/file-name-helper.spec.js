import { buildCdnFileName } from './file-name-helper.js';

describe('file-name-helper', () => {
  describe('buildCdnFileName', () => {
    const testCases = [
      { fileName: 'hello-world-123.mp3', prefix: null, expectedOutput: 'hello-world-123_\\w+\\.mp3' },
      { fileName: 'hello_world_123.mp3', prefix: null, expectedOutput: 'hello-world-123_\\w+\\.mp3' },
      { fileName: 'hello world 123.mp3', prefix: null, expectedOutput: 'hello-world-123_\\w+\\.mp3' },
      { fileName: 'héllö wøȑlð 123.mp3', prefix: null, expectedOutput: 'helloe-wo-ld-123_\\w+\\.mp3' },
      { fileName: 'Hällo Wörld 123.mp3', prefix: null, expectedOutput: 'haello-woerld-123_\\w+\\.mp3' },
      { fileName: 'Hello World 123 !"§.mp3', prefix: null, expectedOutput: 'hello-world-123_\\w+\\.mp3' },
      { fileName: 'Hello World 123 !"§.mp3', prefix: 'media/my-folder/', expectedOutput: 'media/my-folder/hello-world-123_\\w+\\.mp3' }
    ];

    testCases.forEach(({ fileName, prefix, expectedOutput }) => {
      it(`should transform fileName '${fileName} with prefix ${prefix === null ? 'null' : `'${prefix}'`} to match '${expectedOutput}'`, () => {
        const actualOutput = buildCdnFileName(fileName, prefix);
        expect(actualOutput).toMatch(new RegExp(expectedOutput));
      });
    });
  });
});
