import { describe, expect, it } from 'vitest';
import { RESOURCE_TYPE } from '../domain/constants.js';
import { analyzeMediaUrl, formatMediaPosition, formatMillisecondsAsDuration, tryConvertDurationToMilliseconds } from './media-utils.js';

describe('media-utils', () => {

  describe('analyzeMediaUrl', () => {
    const getDefaultResult = url => ({
      sanitizedUrl: url,
      youtubeVideoId: null,
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
          resourceType: RESOURCE_TYPE.none
        }
      },
      {
        url: 'https://a.com/abc.mp3',
        expectedResult: {
          sanitizedUrl: 'https://a.com/abc.mp3',
          youtubeVideoId: null,
          resourceType: RESOURCE_TYPE.audio
        }
      },
      {
        url: 'https://www.youtube.com/watch?v=4cn8439c2',
        expectedResult: {
          sanitizedUrl: 'https://www.youtube.com/watch?v=4cn8439c2',
          youtubeVideoId: '4cn8439c2',
          resourceType: RESOURCE_TYPE.video
        }
      },
      {
        url: 'https://www.youtube.com/watch?v=4cn8439c2&start=5',
        expectedResult: {
          sanitizedUrl: 'https://www.youtube.com/watch?v=4cn8439c2',
          youtubeVideoId: '4cn8439c2',
          resourceType: RESOURCE_TYPE.video
        }
      },
      {
        url: 'https://www.youtube.com/watch?v=4cn8439c2&start=5&end=20',
        expectedResult: {
          sanitizedUrl: 'https://www.youtube.com/watch?v=4cn8439c2',
          youtubeVideoId: '4cn8439c2',
          resourceType: RESOURCE_TYPE.video
        }
      },
      {
        url: 'https://youtu.be/j440-D5JhjI',
        expectedResult: {
          sanitizedUrl: 'https://www.youtube.com/watch?v=j440-D5JhjI',
          youtubeVideoId: 'j440-D5JhjI',
          resourceType: RESOURCE_TYPE.video
        }
      },
      {
        url: 'https://youtu.be/j440-D5JhjI?t=804',
        expectedResult: {
          sanitizedUrl: 'https://www.youtube.com/watch?v=j440-D5JhjI',
          youtubeVideoId: 'j440-D5JhjI',
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
      { milliseconds: 2.2, millisecondsLength: 1, expectedResult: '00:00.0' },
      { milliseconds: 2.2, millisecondsLength: 3, expectedResult: '00:00.002' },
      { milliseconds: 1002, millisecondsLength: 1, expectedResult: '00:01.0' },
      { milliseconds: 1002, millisecondsLength: 3, expectedResult: '00:01.002' },
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

  describe('tryConvertDurationToMilliseconds', () => {
    const testCases = [
      { duration: '', expectedResult: null },
      { duration: '.0', expectedResult: 0 },
      { duration: '.001', expectedResult: 1 },
      { duration: '.01', expectedResult: 10 },
      { duration: '.1', expectedResult: 100 },
      { duration: '.10', expectedResult: 100 },
      { duration: '.100', expectedResult: 100 },
      { duration: '.999', expectedResult: 999 },
      { duration: '.1000', expectedResult: null },
      { duration: '60', expectedResult: null },
      { duration: '59', expectedResult: 59 * 1000 },
      { duration: '59.100', expectedResult: 100 + (59 * 1000) },
      { duration: '59:', expectedResult: 59 * 60 * 1000 },
      { duration: '00:01', expectedResult: 1 * 1000 },
      { duration: '00:60', expectedResult: null },
      { duration: '1:59', expectedResult: (59 * 1000) + (1 * 60 * 1000) },
      { duration: '01:59', expectedResult: (59 * 1000) + (1 * 60 * 1000) },
      { duration: '01:59.100', expectedResult: 100 + (59 * 1000) + (1 * 60 * 1000) },
      { duration: '59:59', expectedResult: (59 * 1000) + (59 * 60 * 1000) },
      { duration: '60:59', expectedResult: null },
      { duration: '00:00:01', expectedResult: 1 * 1000 },
      { duration: '01:01:01', expectedResult: (1 * 1000) + (1 * 60 * 1000) + (1 * 60 * 60 * 1000) },
      { duration: '01:01:01.100', expectedResult: 100 + (1 * 1000) + (1 * 60 * 1000) + (1 * 60 * 60 * 1000) },
      { duration: ':01:01:01.100', expectedResult: null },
      { duration: '10:01:01:01.100', expectedResult: null },
      { duration: '01:01.100.99', expectedResult: null },
      { duration: 'a', expectedResult: null },
      { duration: 'c.100', expectedResult: null },
      { duration: 'c.100', expectedResult: null },
      { duration: '1b2.100', expectedResult: null },
      { duration: 'a:1.100', expectedResult: null }
    ];

    testCases.forEach(({ duration, expectedResult }) => {
      describe(`when called with duration = '${duration}'`, () => {
        it(`should return ${expectedResult} milliseconds`, () => {
          expect(tryConvertDurationToMilliseconds(duration)).toBe(expectedResult);
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
