import { beforeEach, describe, expect, it } from 'vitest';
import { createTagSearchQuery, createTagsPipelineQuery } from './tag-utils.js';

describe('tag-utils', () => {

  describe('createTagSearchQuery', () => {
    let result;

    const testCases = [
      {
        searchExpression: '',
        expectedResult: {
          isValid: false,
          query: null,
          positiveTokens: new Set([]),
          negativeTokens: new Set([])
        }
      },
      {
        searchExpression: '-notThis',
        expectedResult: {
          isValid: false,
          query: null,
          positiveTokens: new Set([]),
          negativeTokens: new Set(['notthis'])
        }
      },
      {
        searchExpression: 'a',
        expectedResult: {
          isValid: true,
          query: { tags: { $regex: '^(a)$', $options: 'i' } },
          positiveTokens: new Set(['a']),
          negativeTokens: new Set([])
        }
      },
      {
        searchExpression: 'this',
        expectedResult: {
          isValid: true,
          query: { tags: { $regex: '.*(this).*', $options: 'i' } },
          positiveTokens: new Set(['this']),
          negativeTokens: new Set([])
        }
      },
      {
        searchExpression: 'this andThis -butNotThis',
        expectedResult: {
          isValid: true,
          query: {
            $and: [
              { tags: { $regex: '.*(this|andthis).*', $options: 'i' } },
              { tags: { $not: { $regex: '^(butnotthis)$', $options: 'i' } } }
            ]
          },
          positiveTokens: new Set(['this', 'andthis']),
          negativeTokens: new Set(['butnotthis'])
        }
      },
      {
        searchExpression: 'a and b -butNotC',
        expectedResult: {
          isValid: true,
          query: {
            $and: [
              { tags: { $regex: '^(a|b)$|.*(and).*', $options: 'i' } },
              { tags: { $not: { $regex: '^(butnotc)$', $options: 'i' } } }
            ]
          },
          positiveTokens: new Set(['a', 'and', 'b']),
          negativeTokens: new Set(['butnotc'])
        }
      }
    ];

    testCases.forEach(({ searchExpression, expectedResult }) => {
      describe(`when searchExpression is '${searchExpression}'`, () => {
        beforeEach(() => {
          result = createTagSearchQuery(searchExpression);
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
