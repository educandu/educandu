import { getDayOfWeek } from './date-utils.js';
import { beforeEach, describe, expect, it } from 'vitest';

describe('date-utils', () => {
  let result;

  describe('getDayOfWeek', () => {
    const testCases = [
      {
        date: new Date('2024-04-01T16:00:00.000Z'),
        expectedResult: 'Mon'
      },
      {
        date: new Date('2024-04-02T16:00:00.000Z'),
        expectedResult: 'Tue'
      },
      {
        date: new Date('2024-04-03T16:00:00.000Z'),
        expectedResult: 'Wed'
      },
      {
        date: new Date('2024-04-04T16:00:00.000Z'),
        expectedResult: 'Thu'
      },
      {
        date: new Date('2024-04-05T16:00:00.000Z'),
        expectedResult: 'Fri'
      },
      {
        date: new Date('2024-04-06T16:00:00.000Z'),
        expectedResult: 'Sat'
      },
      {
        date: new Date('2024-04-07T16:00:00.000Z'),
        expectedResult: 'Sun'
      }
    ];

    testCases.forEach(({ date, expectedResult }) => {
      describe(`when date is '${date}'`, () => {
        beforeEach(() => {
          result = getDayOfWeek(date);
        });
        it(`should return '${expectedResult}'`, () => {
          expect(result).toBe(expectedResult);
        });
      });
    });
  });
});
