import { RESOURCE_TYPE } from '../domain/constants.js';
import { trimChaptersToFitRange, analyzeMediaUrl, formatMillisecondsAsDuration } from './media-utils.js';

describe('media-utils', () => {

  describe('analyzeMediaUrl', () => {
    const testCases = [
      { url: null, expectedError: 'Invalid URL', expectedResult: null },
      { url: '', expectedError: 'Invalid URL', expectedResult: null },
      { url: 'not a URL', expectedError: 'Invalid URL', expectedResult: null },
      { url: 'https://', expectedError: 'Invalid URL', expectedResult: null },
      {
        url: 'https://a',
        expectedError: null,
        expectedResult: {
          sanitizedUrl: 'https://a/',
          isYoutube: false,
          startTimecode: null,
          stopTimecode: null,
          resourceType: RESOURCE_TYPE.none
        }
      },
      {
        url: 'https://a.com/abc.mp3',
        expectedError: null,
        expectedResult: {
          sanitizedUrl: 'https://a.com/abc.mp3',
          isYoutube: false,
          startTimecode: null,
          stopTimecode: null,
          resourceType: RESOURCE_TYPE.audio
        }
      },
      {
        url: 'https://www.youtube.com/watch?v=4cn8439c2',
        expectedError: null,
        expectedResult: {
          sanitizedUrl: 'https://www.youtube.com/watch?v=4cn8439c2',
          isYoutube: true,
          startTimecode: null,
          stopTimecode: null,
          resourceType: RESOURCE_TYPE.video
        }
      },
      {
        url: 'https://www.youtube.com/watch?v=4cn8439c2&start=5',
        expectedError: null,
        expectedResult: {
          sanitizedUrl: 'https://www.youtube.com/watch?v=4cn8439c2',
          isYoutube: true,
          startTimecode: 5000,
          stopTimecode: null,
          resourceType: RESOURCE_TYPE.video
        }
      },
      {
        url: 'https://www.youtube.com/watch?v=4cn8439c2&start=5&end=20',
        expectedError: null,
        expectedResult: {
          sanitizedUrl: 'https://www.youtube.com/watch?v=4cn8439c2',
          isYoutube: true,
          startTimecode: 5000,
          stopTimecode: 20000,
          resourceType: RESOURCE_TYPE.video
        }
      },
      {
        url: 'https://youtu.be/j440-D5JhjI',
        expectedError: null,
        expectedResult: {
          sanitizedUrl: 'https://www.youtube.com/watch?v=j440-D5JhjI',
          isYoutube: true,
          startTimecode: null,
          stopTimecode: null,
          resourceType: RESOURCE_TYPE.video
        }
      },
      {
        url: 'https://youtu.be/j440-D5JhjI?t=804',
        expectedError: null,
        expectedResult: {
          sanitizedUrl: 'https://www.youtube.com/watch?v=j440-D5JhjI',
          isYoutube: true,
          startTimecode: 804000,
          stopTimecode: null,
          resourceType: RESOURCE_TYPE.video
        }
      }
    ];

    testCases.forEach(({ url, expectedError, expectedResult }) => {
      describe(`when called with url ${JSON.stringify(url)}`, () => {
        if (expectedError) {
          it('should throw the expected error', () => {
            expect(() => analyzeMediaUrl(url)).toThrowError(expectedError);
          });
        } else {
          it('should return the expected result', () => {
            expect(analyzeMediaUrl(url)).toStrictEqual(expectedResult);
          });
        }
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
      describe(`when called with milliseconds = ${milliseconds}`, () => {
        it(`should return '${expectedResult}'`, () => {
          expect(formatMillisecondsAsDuration(milliseconds)).toBe(expectedResult);
        });
      });
    });
  });

  describe('trimChaptersToFitRange', () => {
    const testCases = [
      {
        description: 'when the chapters fit into the whole media (no range set)',
        expectation: 'should not delete any chapters',
        input: {
          chapters: [{ key: 'aaa', startTimecode: 0 }, { key: 'bbb', startTimecode: 999 }],
          duration: 1000,
          range: { startTimecode: null, stopTimecode: null }
        },
        expectedResult: [{ key: 'aaa', startTimecode: 0 }, { key: 'bbb', startTimecode: 999 }]
      },
      {
        description: 'when the chapters fit into the selected media range',
        expectation: 'should not delete any chapters',
        input: {
          chapters: [{ key: 'aaa', startTimecode: 0 }, { key: 'bbb', startTimecode: 999 }],
          duration: 2000,
          range: { startTimecode: 500, stopTimecode: 1500 }
        },
        expectedResult: [{ key: 'aaa', startTimecode: 0 }, { key: 'bbb', startTimecode: 999 }]
      },
      {
        description: 'when the chapters do not fit into the whole media (no range set)',
        expectation: 'should delete overflowing chapters at the and',
        input: {
          chapters: [{ key: 'aaa', startTimecode: 0 }, { key: 'bbb', startTimecode: 1000 }],
          duration: 1000,
          range: { startTimecode: null, stopTimecode: null }
        },
        expectedResult: [{ key: 'aaa', startTimecode: 0 }]
      },
      {
        description: 'when the chapters do not fit into the selected media range',
        expectation: 'should delete overflowing chapters at the and',
        input: {
          chapters: [{ key: 'aaa', startTimecode: 0 }, { key: 'bbb', startTimecode: 1000 }],
          duration: 2000,
          range: { startTimecode: 500, stopTimecode: 1500 }
        },
        expectedResult: [{ key: 'aaa', startTimecode: 0 }]
      },
      {
        description: 'when the media length is 0',
        expectation: 'should only keep the first chapter (starting at timecode 0)',
        input: {
          chapters: [{ key: 'aaa', startTimecode: 0 }, { key: 'bbb', startTimecode: 1000 }],
          duration: 0,
          range: { startTimecode: null, stopTimecode: null }
        },
        expectedResult: [{ key: 'aaa', startTimecode: 0 }]
      }
    ];

    testCases.forEach(({ description, expectation, input, expectedResult }) => {
      describe(description, () => {
        it(expectation, () => {
          expect(trimChaptersToFitRange(input)).toStrictEqual(expectedResult);
        });
      });
    });
  });

});
