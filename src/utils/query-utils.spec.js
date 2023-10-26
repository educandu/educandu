import { beforeEach, describe, expect, it } from 'vitest';
import { createTextSearchQuery, createTagsPipelineQuery } from './query-utils.js';

describe('query-utils', () => {

  describe('createTextSearchQuery', () => {
    let result;

    const testCases = [
      {
        searchExpression: '',
        fields: ['tags'],
        expectedResult: {
          isValid: false,
          query: null,
          positiveTokens: new Set([]),
          negativeTokens: new Set([])
        }
      },
      {
        searchExpression: '-notThis',
        fields: ['tags'],
        expectedResult: {
          isValid: false,
          query: null,
          positiveTokens: new Set([]),
          negativeTokens: new Set(['notthis'])
        }
      },
      {
        searchExpression: 'a',
        fields: ['tags'],
        expectedResult: {
          isValid: true,
          query: { tags: { $regex: '^a$', $options: 'i' } },
          positiveTokens: new Set(['a']),
          negativeTokens: new Set([])
        }
      },
      {
        searchExpression: 'this',
        fields: ['tags'],
        expectedResult: {
          isValid: true,
          query: { tags: { $regex: '.*this.*', $options: 'i' } },
          positiveTokens: new Set(['this']),
          negativeTokens: new Set([])
        }
      },
      {
        searchExpression: 'this andThis -butNotThis',
        fields: ['tags'],
        expectedResult: {
          isValid: true,
          query: {
            $and: [
              { tags: { $regex: '.*this.*', $options: 'i' } },
              { tags: { $regex: '.*andthis.*', $options: 'i' } },
              { tags: { $not: { $regex: '.*butnotthis.*', $options: 'i' } } }
            ]
          },
          positiveTokens: new Set(['this', 'andthis']),
          negativeTokens: new Set(['butnotthis'])
        }
      },
      {
        searchExpression: 'a and b -C',
        fields: ['tags'],
        expectedResult: {
          isValid: true,
          query: {
            $and: [
              { tags: { $regex: '^a$', $options: 'i' } },
              { tags: { $regex: '.*and.*', $options: 'i' } },
              { tags: { $regex: '^b$', $options: 'i' } },
              { tags: { $not: { $regex: '^c$', $options: 'i' } } }
            ]
          },
          positiveTokens: new Set(['a', 'and', 'b']),
          negativeTokens: new Set(['c'])
        }
      },
      {
        searchExpression: 'a and b -butNotC',
        fields: ['tags', 'name'],
        expectedResult: {
          isValid: true,
          query: {
            $and: [
              {
                $or: [
                  { tags: { $regex: '^a$', $options: 'i' } },
                  { name: { $regex: '^a$', $options: 'i' } }
                ]
              },
              {
                $or: [
                  { tags: { $regex: '.*and.*', $options: 'i' } },
                  { name: { $regex: '.*and.*', $options: 'i' } }
                ]
              },
              {
                $or: [
                  { tags: { $regex: '^b$', $options: 'i' } },
                  { name: { $regex: '^b$', $options: 'i' } }
                ]
              },
              {
                $and: [
                  { tags: { $not: { $regex: '.*butnotc.*', $options: 'i' } } },
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

});
