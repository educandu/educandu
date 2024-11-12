import escapeStringRegexp from 'escape-string-regexp';
import transliterate from '@sindresorhus/transliterate';
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

export function createTextSearchQuery(searchExpression, keys) {
  const tokens = (searchExpression || '').trim().split(/\s+/);

  const positiveTokens = new Set();
  const negativeTokens = new Set();

  for (const token of tokens) {
    const isNegative = token.startsWith('-');
    const rawToken = token.slice(isNegative ? 1 : 0);
    if (rawToken) {
      (isNegative ? negativeTokens : positiveTokens).add(transliterate(rawToken).toLowerCase());
    }
  }

  const queryConditions = positiveTokens.size
    ? [
      ...[...positiveTokens].map(token => combineQueryConditions('$or', keys.map(key => ({ [key]: createTokenSearchRegex(token) })))),
      ...[...negativeTokens].map(token => combineQueryConditions('$and', keys.map(key => ({ [key]: { $not: createTokenSearchRegex(token) } }))))
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

export function parseNumberArrayFromCsv(value) {
  return (value || '')
    .split(',')
    .map(stringItem => Number.parseInt(stringItem, 10))
    .filter(numberItem => !isNaN(numberItem));
}

export function parseDate(value) {
  const date = Date.parse(value || '');
  return isNaN(date) ? null : new Date(date);
}
