import escapeStringRegexp from 'escape-string-regexp';
import { tokenizeForSearch } from './string-utils.js';
import { PARTIAL_SEARCH_THRESHOLD } from '../domain/constants.js';

const createTokenSearchRegex = token => {
  const escapedToken = escapeStringRegexp(token);
  const needsExactMatch = token.length < PARTIAL_SEARCH_THRESHOLD;
  const regexString = needsExactMatch ? `^${escapedToken}$` : `.*${escapedToken}.*`;
  return { $regex: regexString, $options: 'i' };
};

export function combineQueryConditions(operator, conditions, allowEmpty = false) {
  switch (conditions.length) {
    case 0:
      if (!allowEmpty) {
        throw new Error('Empty query conditions are not allowed');
      }
      return null;
    case 1:
      return conditions[0];
    default:
      return { [operator]: conditions };
  }
}

export function createTextSearchQuery(searchExpression, key) {
  const { positiveTokens, negativeTokens } = tokenizeForSearch(searchExpression);

  const queryConditions = positiveTokens.size
    ? [
      ...[...positiveTokens].map(token => ({ [key]: createTokenSearchRegex(token) })),
      ...[...negativeTokens].map(token => ({ [key]: { $not: createTokenSearchRegex(token) } }))
    ]
    : [];

  const query = combineQueryConditions('$and', queryConditions, true);

  return {
    isValid: !!query,
    query,
    positiveTokens,
    negativeTokens
  };
}

export function createTagsPipelineQuery(searchString = '', tagsKey = 'tags') {
  if (!searchString) {
    return {
      isValid: false,
      query: null
    };
  }

  return {
    isValid: true,
    query: [
      { $unwind: `$${tagsKey}` },
      { $match: { [tagsKey]: { $regex: `.*${escapeStringRegexp(searchString)}.*`, $options: 'i' } } },
      { $group: { _id: null, uniqueTags: { $push: `$${tagsKey}` } } },
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
  };
}

export function parseDaysOfWeek(value) {
  return (value || '')
    .split('')
    .map(stringValue => Number.parseInt(stringValue, 10))
    .filter(numberValue => !isNaN(numberValue) && numberValue > 0 && numberValue < 8);
}

export function parseDate(value) {
  const date = Date.parse(value || '');
  return isNaN(date) ? null : new Date(date);
}
