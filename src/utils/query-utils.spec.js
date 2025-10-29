import { beforeEach, describe, expect, it } from 'vitest';
import { createTextSearchQuery, createTagsPipelineQuery } from './query-utils.js';

describe('query-utils', () => {

  describe('createTextSearchQuery', () => {
    let result;

    const testCases = [
      {
        searchExpression: '',
        key: 'searchTokens',
        expectedResult: {
          isValid: false,
          query: null,
          positiveTokens: new Set([]),
          negativeTokens: new Set([])
        }
      },
      {
        searchExpression: '-notThis',
        key: 'searchTokens',
        expectedResult: {
          isValid: false,
          query: null,
          positiveTokens: new Set([]),
          negativeTokens: new Set(['notthis'])
        }
      },
      {
        searchExpression: 'a',
        key: 'searchTokens',
        expectedResult: {
          isValid: true,
          query: { searchTokens: { $regex: '^a$', $options: 'i' } },
          positiveTokens: new Set(['a']),
          negativeTokens: new Set([])
        }
      },
      {
        searchExpression: 'this',
        key: 'searchTokens',
        expectedResult: {
          isValid: true,
          query: { searchTokens: { $regex: '.*this.*', $options: 'i' } },
          positiveTokens: new Set(['this']),
          negativeTokens: new Set([])
        }
      },
      {
        searchExpression: 'this andThis -butNotThis',
        key: 'searchTokens',
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
        key: 'searchTokens',
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
        key: 'searchTokens',
        expectedResult: {
          isValid: true,
          query: {
            $and: [
              { searchTokens: { $regex: '^a$', $options: 'i' } },
              { searchTokens: { $regex: '.*and.*', $options: 'i' } },
              { searchTokens: { $regex: '^b$', $options: 'i' } },
              { searchTokens: { $not: { $regex: '.*butnotc.*', $options: 'i' } } }
            ]
          },
          positiveTokens: new Set(['a', 'and', 'b']),
          negativeTokens: new Set(['butnotc'])
        }
      }
    ];

    testCases.forEach(({ searchExpression, key, expectedResult }) => {
      describe(`when searchExpression is '${searchExpression}' and key is '${key}'`, () => {
        beforeEach(() => {
          result = createTextSearchQuery(searchExpression, key);
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

});
