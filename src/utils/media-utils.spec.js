import { RESOURCE_TYPE } from '../domain/constants.js';
import { analyzeMediaUrl, formatMediaPosition, formatMillisecondsAsDuration } from './media-utils.js';

describe('media-utils', () => {

  describe('analyzeMediaUrl', () => {
    const getDefaultResult = url => ({
      sanitizedUrl: url,
      youtubeVideoId: null,
      startTimecode: null,
      stopTimecode: null,
      resourceType: RESOURCE_TYPE.none
    });

    const negativeTestCases = [null, '', 'not a URL', 'https://'].map(url => ({ url, expectedResult: getDefaultResult(url) }));
    const testCases = [
      ...negativeTestCases,
      {
        url: 'https://a',
        expectedResult: {
          sanitizedUrl: 'https://a/',
          youtubeVideoId: null,
          startTimecode: null,
          stopTimecode: null,
          resourceType: RESOURCE_TYPE.none
        }
      },
      {
        url: 'https://a.com/abc.mp3',
        expectedResult: {
          sanitizedUrl: 'https://a.com/abc.mp3',
          youtubeVideoId: null,
          startTimecode: null,
          stopTimecode: null,
          resourceType: RESOURCE_TYPE.audio
        }
      },
      {
        url: 'https://www.youtube.com/watch?v=4cn8439c2',
        expectedResult: {
          sanitizedUrl: 'https://www.youtube.com/watch?v=4cn8439c2',
          youtubeVideoId: '4cn8439c2',
          startTimecode: null,
          stopTimecode: null,
          resourceType: RESOURCE_TYPE.video
        }
      },
      {
        url: 'https://www.youtube.com/watch?v=4cn8439c2&start=5',
        expectedResult: {
          sanitizedUrl: 'https://www.youtube.com/watch?v=4cn8439c2',
          youtubeVideoId: '4cn8439c2',
          startTimecode: 5000,
          stopTimecode: null,
          resourceType: RESOURCE_TYPE.video
        }
      },
      {
        url: 'https://www.youtube.com/watch?v=4cn8439c2&start=5&end=20',
        expectedResult: {
          sanitizedUrl: 'https://www.youtube.com/watch?v=4cn8439c2',
          youtubeVideoId: '4cn8439c2',
          startTimecode: 5000,
          stopTimecode: 20000,
          resourceType: RESOURCE_TYPE.video
        }
      },
      {
        url: 'https://youtu.be/j440-D5JhjI',
        expectedResult: {
          sanitizedUrl: 'https://www.youtube.com/watch?v=j440-D5JhjI',
          youtubeVideoId: 'j440-D5JhjI',
          startTimecode: null,
          stopTimecode: null,
          resourceType: RESOURCE_TYPE.video
        }
      },
      {
        url: 'https://youtu.be/j440-D5JhjI?t=804',
        expectedResult: {
          sanitizedUrl: 'https://www.youtube.com/watch?v=j440-D5JhjI',
          youtubeVideoId: 'j440-D5JhjI',
          startTimecode: 804000,
          stopTimecode: null,
          resourceType: RESOURCE_TYPE.video
        }
      }
    ];

    testCases.forEach(({ url, expectedResult }) => {
      describe(`when called with url ${JSON.stringify(url)}`, () => {
        it('should return the expected result', () => {
          expect(analyzeMediaUrl(url)).toStrictEqual(expectedResult);
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
      { milliseconds: null, expectedResult: '00:00' },
      { milliseconds: null, millisecondsLength: 0, expectedResult: '00:00' },
      { milliseconds: null, millisecondsLength: 1, expectedResult: '00:00.0' },
      { milliseconds: 20547004, millisecondsLength: 1, expectedResult: '05:42:27.0' },
      { milliseconds: 20547004, millisecondsLength: 2, expectedResult: '05:42:27.00' },
      { milliseconds: 20547004, millisecondsLength: 3, expectedResult: '05:42:27.004' },
      { milliseconds: 20547684, millisecondsLength: 3, expectedResult: '05:42:27.684' }
    ];

    testCases.forEach(({ milliseconds, millisecondsLength, expectedResult }) => {
      describe(`when called with milliseconds = ${milliseconds}`, () => {
        it(`should return '${expectedResult}'`, () => {
          expect(formatMillisecondsAsDuration(milliseconds, { millisecondsLength })).toBe(expectedResult);
        });
      });
    });
  });

  describe('formatMediaPosition', () => {
    const percentageFormatter = new Intl.NumberFormat('en', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    const formatPercentage = num => percentageFormatter.format(num);

    const testCases = [
      { position: 0, duration: 0, expectedResult: '0.00%' },
      { position: 0.5, duration: 0, expectedResult: '50.00%' },
      { position: 1, duration: 0, expectedResult: '100.00%' },
      { position: 0, duration: 60000, expectedResult: '00:00' },
      { position: 0.50, duration: 60000, expectedResult: '00:30' },
      { position: 1, duration: 60000, expectedResult: '01:00' }
    ];

    testCases.forEach(({ position, duration, expectedResult }) => {
      describe(`when called with position = ${position} and duration = ${duration}`, () => {
        it(`should return '${expectedResult}'`, () => {
          expect(formatMediaPosition({ formatPercentage, position, duration })).toBe(expectedResult);
        });
      });
    });
  });
});
