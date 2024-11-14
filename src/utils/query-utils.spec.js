import { beforeEach, describe, expect, it } from 'vitest';
import { createTextSearchQuery, createTagsPipelineQuery, parseNumberArrayFromCsv, parseDate } from './query-utils.js';

describe('query-utils', () => {

  describe('createTextSearchQuery', () => {
    let result;

    const testCases = [
      {
        searchExpression: '',
        fields: ['searchTokens'],
        expectedResult: {
          isValid: false,
          query: null,
          positiveTokens: new Set([]),
          negativeTokens: new Set([])
        }
      },
      {
        searchExpression: '-notThis',
        fields: ['searchTokens'],
        expectedResult: {
          isValid: false,
          query: null,
          positiveTokens: new Set([]),
          negativeTokens: new Set(['notthis'])
        }
      },
      {
        searchExpression: 'a',
        fields: ['searchTokens'],
        expectedResult: {
          isValid: true,
          query: { searchTokens: { $regex: '^a$', $options: 'i' } },
          positiveTokens: new Set(['a']),
          negativeTokens: new Set([])
        }
      },
      {
        searchExpression: 'this',
        fields: ['searchTokens'],
        expectedResult: {
          isValid: true,
          query: { searchTokens: { $regex: '.*this.*', $options: 'i' } },
          positiveTokens: new Set(['this']),
          negativeTokens: new Set([])
        }
      },
      {
        searchExpression: 'this andThis -butNotThis',
        fields: ['searchTokens'],
        expectedResult: {
          isValid: true,
          query: {
            $and: [
              { searchTokens: { $regex: '.*this.*', $options: 'i' } },
              { searchTokens: { $regex: '.*andthis.*', $options: 'i' } },
              { searchTokens: { $not: { $regex: '.*butnotthis.*', $options: 'i' } } }
            ]
          },
          positiveTokens: new Set(['this', 'andthis']),
          negativeTokens: new Set(['butnotthis'])
        }
      },
      {
        searchExpression: 'a and b -C',
        fields: ['searchTokens'],
        expectedResult: {
          isValid: true,
          query: {
            $and: [
              { searchTokens: { $regex: '^a$', $options: 'i' } },
              { searchTokens: { $regex: '.*and.*', $options: 'i' } },
              { searchTokens: { $regex: '^b$', $options: 'i' } },
              { searchTokens: { $not: { $regex: '^c$', $options: 'i' } } }
            ]
          },
          positiveTokens: new Set(['a', 'and', 'b']),
          negativeTokens: new Set(['c'])
        }
      },
      {
        searchExpression: 'a and b -butNotC',
        fields: ['searchTokens', 'name'],
        expectedResult: {
          isValid: true,
          query: {
            $and: [
              {
                $or: [
                  { searchTokens: { $regex: '^a$', $options: 'i' } },
                  { name: { $regex: '^a$', $options: 'i' } }
                ]
              },
              {
                $or: [
                  { searchTokens: { $regex: '.*and.*', $options: 'i' } },
                  { name: { $regex: '.*and.*', $options: 'i' } }
                ]
              },
              {
                $or: [
                  { searchTokens: { $regex: '^b$', $options: 'i' } },
                  { name: { $regex: '^b$', $options: 'i' } }
                ]
              },
              {
                $and: [
                  { searchTokens: { $not: { $regex: '.*butnotc.*', $options: 'i' } } },
                  { name: { $not: { $regex: '.*butnotc.*', $options: 'i' } } }
                ]
              }
            ]
          },
          positiveTokens: new Set(['a', 'and', 'b']),
          negativeTokens: new Set(['butnotc'])
        }
      }
    ];

    testCases.forEach(({ searchExpression, fields, expectedResult }) => {
      describe(`when searchExpression is '${searchExpression}' and fields are '${fields.join('\' and \'')}'`, () => {
        beforeEach(() => {
          result = createTextSearchQuery(searchExpression, fields);
        });
        it('should return the expected result', () => {
          expect(result).toStrictEqual(expectedResult);
        });
      });
    });
  });

  describe('createTagsPipelineQuery', () => {
    let result;

    describe('when search string is empty', () => {
      beforeEach(() => {
        result = createTagsPipelineQuery('');
      });
      it('should return an invalid result', () => {
        expect(result).toStrictEqual({
          isValid: false,
          query: null
        });
      });
    });

    describe('when search string is not empty', () => {
      beforeEach(() => {
        result = createTagsPipelineQuery('ab.c');
      });
      it('should return a valid result', () => {
        expect(result).toStrictEqual({
          isValid: true,
          query: [
            { $unwind: '$tags' },
            { $match: { tags: { $regex: '.*ab\\.c.*', $options: 'i' } } },
            { $group: { _id: null, uniqueTags: { $push: '$tags' } } },
            { $project: {
              _id: 0,
              uniqueTags: {
                $reduce: {
                  input: '$uniqueTags',
                  initialValue: [],
                  in: {
                    $let: {
                      vars: { elem: { $concatArrays: [['$$this'], '$$value'] } },
                      in: { $setUnion: '$$elem' }
                    }
                  }
                }
              }
            } }
          ]
        });
      });
    });
  });

  describe('parseNumberArrayFromCsv', () => {
    let result;

    const testCases = [
      { value: '', expectedResult: [] },
      { value: '1,2 ', expectedResult: [1,2] },
      { value: '1,NaN', expectedResult: [1] },
    ];

    testCases.forEach(({ value, expectedResult }) => {
      describe(`when the value is '${value}'`, () => {
        beforeEach(() => {
          result = parseNumberArrayFromCsv(value);
        });

        it(`should return [${expectedResult}]`, () => {
          expect(result).toStrictEqual(expectedResult);
        });
      });
    });
  });

  describe('parseDate', () => {
    let result;

    const testCases = [
      { value: '', expectedResult: null },
      { value: 0, expectedResult: null },
      { value: 'invalid format', expectedResult: null },
      { value: '2024-04-03T00:00:00.000Z', expectedResult: new Date('2024-04-03T00:00:00.000Z') }
    ];

    testCases.forEach(({ value, expectedResult }) => {
      describe(`when the value is '${value}'`, () => {
        beforeEach(() => {
          result = parseDate(value);
        });

        it(`should return [${expectedResult}]`, () => {
          expect(result).toStrictEqual(expectedResult);
        });
      });
    });
  });

});
