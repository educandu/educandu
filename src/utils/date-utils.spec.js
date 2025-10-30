import { beforeEach, describe, expect, it } from 'vitest';
import { addDays, dateToNumericDay, getDayOfWeek, getStartOfDay, parseDaysOfWeek, parseTime } from './date-utils.js';

describe('date-utils', () => {
  let result;

  describe('getDayOfWeek', () => {
    const testCases = [
      {
        date: new Date('2024-04-01T16:00:00.000Z'),
        expectedResult: 1
      },
      {
        date: new Date('2024-04-02T16:00:00.000Z'),
        expectedResult: 2
      },
      {
        date: new Date('2024-04-03T16:00:00.000Z'),
        expectedResult: 3
      },
      {
        date: new Date('2024-04-04T16:00:00.000Z'),
        expectedResult: 4
      },
      {
        date: new Date('2024-04-05T16:00:00.000Z'),
        expectedResult: 5
      },
      {
        date: new Date('2024-04-06T16:00:00.000Z'),
        expectedResult: 6
      },
      {
        date: new Date('2024-04-07T16:00:00.000Z'),
        expectedResult: 7
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

  describe('dateToNumericDay', () => {
    const testCases = [
      {
        date: new Date('2025-01-01T00:00:00.000Z'),
        expectedResult: 20250101
      },
      {
        date: new Date('2024-12-31T23:59:59.999Z'),
        expectedResult: 20241231
      },
      {
        date: new Date('2025-03-05T12:30:00.000Z'),
        expectedResult: 20250305
      },
      {
        date: new Date('2024-02-29T16:00:00.000Z'),
        expectedResult: 20240229
      },
      {
        date: new Date('2023-07-15T08:45:30.000Z'),
        expectedResult: 20230715
      },
      {
        date: new Date('2025-11-09T00:00:00.000Z'),
        expectedResult: 20251109
      }
    ];

    testCases.forEach(({ date, expectedResult }) => {
      describe(`when date is '${date.toISOString()}'`, () => {
        beforeEach(() => {
          result = dateToNumericDay(date);
        });
        it(`should return ${expectedResult}`, () => {
          expect(result).toBe(expectedResult);
        });
      });
    });
  });

  describe('getStartOfDay', () => {
    const testCases = [
      {
        date: new Date('2025-01-01T00:00:00.000Z'),
        expectedResult: new Date('2025-01-01T00:00:00.000Z')
      },
      {
        date: new Date('2025-01-01T12:30:45.123Z'),
        expectedResult: new Date('2025-01-01T00:00:00.000Z')
      },
      {
        date: new Date('2025-01-01T23:59:59.999Z'),
        expectedResult: new Date('2025-01-01T00:00:00.000Z')
      },
      {
        date: new Date('2024-02-29T16:00:00.000Z'),
        expectedResult: new Date('2024-02-29T00:00:00.000Z')
      },
      {
        date: new Date('2025-12-31T18:45:30.500Z'),
        expectedResult: new Date('2025-12-31T00:00:00.000Z')
      }
    ];

    testCases.forEach(({ date, expectedResult }) => {
      describe(`when date is '${date.toISOString()}'`, () => {
        beforeEach(() => {
          result = getStartOfDay(date);
        });
        it(`should return '${expectedResult.toISOString()}'`, () => {
          expect(result).toEqual(expectedResult);
        });
      });
    });
  });

  describe('addDays', () => {
    const testCases = [
      {
        date: new Date('2025-01-01T12:00:00.000Z'),
        days: 1,
        expectedResult: new Date('2025-01-02T12:00:00.000Z')
      },
      {
        date: new Date('2025-01-01T12:00:00.000Z'),
        days: 7,
        expectedResult: new Date('2025-01-08T12:00:00.000Z')
      },
      {
        date: new Date('2025-01-31T12:00:00.000Z'),
        days: 1,
        expectedResult: new Date('2025-02-01T12:00:00.000Z')
      },
      {
        date: new Date('2024-02-28T12:00:00.000Z'),
        days: 1,
        expectedResult: new Date('2024-02-29T12:00:00.000Z')
      },
      {
        date: new Date('2025-02-28T12:00:00.000Z'),
        days: 1,
        expectedResult: new Date('2025-03-01T12:00:00.000Z')
      },
      {
        date: new Date('2025-01-01T12:00:00.000Z'),
        days: -1,
        expectedResult: new Date('2024-12-31T12:00:00.000Z')
      },
      {
        date: new Date('2025-01-01T12:00:00.000Z'),
        days: 365,
        expectedResult: new Date('2026-01-01T12:00:00.000Z')
      },
      {
        date: new Date('2025-12-31T23:59:59.999Z'),
        days: 1,
        expectedResult: new Date('2026-01-01T23:59:59.999Z')
      }
    ];

    testCases.forEach(({ date, days, expectedResult }) => {
      describe(`when date is '${date.toISOString()}' and days is ${days}`, () => {
        beforeEach(() => {
          result = addDays(date, days);
        });
        it(`should return '${expectedResult.toISOString()}'`, () => {
          expect(result).toEqual(expectedResult);
        });
      });
    });
  });

  describe('parseDaysOfWeek', () => {
    const testCases = [
      { value: '', expectedResult: [] },
      { value: '12 ', expectedResult: [1, 2] },
      { value: '1NaN', expectedResult: [1] },
      { value: '03568', expectedResult: [3, 5, 6] }
    ];

    testCases.forEach(({ value, expectedResult }) => {
      describe(`when the value is '${value}'`, () => {
        beforeEach(() => {
          result = parseDaysOfWeek(value);
        });

        it(`should return [${expectedResult.join(', ')}]`, () => {
          expect(result).toStrictEqual(expectedResult);
        });
      });
    });
  });

  describe('parseTime', () => {
    const testCases = [
      {
        value: '1609459200000',
        expectedResult: new Date(1609459200000)
      },
      {
        value: '0',
        expectedResult: new Date(0)
      },
      {
        value: '1735689600000',
        expectedResult: new Date(1735689600000)
      },
      {
        value: 1609459200000,
        expectedResult: new Date(1609459200000)
      },
      {
        value: 0,
        expectedResult: new Date(0)
      },
      {
        value: 'invalid',
        expectedResult: null
      },
      {
        value: '',
        expectedResult: null
      },
      {
        value: null,
        expectedResult: null
      },
      {
        value: 'NaN',
        expectedResult: null
      },
      {
        value: Number.NaN,
        expectedResult: null
      },
      {
        value: 'abc123',
        expectedResult: null
      },
      {
        value: '123abc',
        expectedResult: null
      },
      {
        value: '  456  ',
        expectedResult: null
      }
    ];

    testCases.forEach(({ value, expectedResult }) => {
      describe(`when the value is ${JSON.stringify(value)}`, () => {
        beforeEach(() => {
          result = parseTime(value);
        });

        it(`should return ${expectedResult === null ? 'null' : expectedResult.toISOString()}`, () => {
          expect(result).toEqual(expectedResult);
        });
      });
    });
  });

});
