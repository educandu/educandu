import escapeStringRegexp from 'escape-string-regexp';
import { TAG_PARTIAL_SEARCH_THRESHOLD } from '../domain/constants.js';

export function createTagSearchQuery(searchExpression = '', tagsKey = 'tags') {
  const tokens = searchExpression.trim().split(/\s+/);

  const allPositiveTokens = new Set();
  const positiveExactTokens = new Set();
  const positivePartialTokens = new Set();
  const allNegativeTokens = new Set();

  for (const token of tokens) {
    const isNegative = token.startsWith('-');
    const rawToken = token.slice(isNegative ? 1 : 0).toLowerCase();
    if (rawToken) {
      if (isNegative) {
        allNegativeTokens.add(rawToken);
      } else {
        allPositiveTokens.add(rawToken);
        if (rawToken.length < TAG_PARTIAL_SEARCH_THRESHOLD) {
          positiveExactTokens.add(rawToken);
        } else {
          positivePartialTokens.add(rawToken);
        }
      }
    }
  }

  let finalQuery;

  if (allPositiveTokens.size) {
    const positiveRegexpParts = [];
    if (positiveExactTokens.size) {
      positiveRegexpParts.push(`^(${[...positiveExactTokens].map(escapeStringRegexp).join('|')})$`);
    }
    if (positivePartialTokens.size) {
      positiveRegexpParts.push(`.*(${[...positivePartialTokens].map(escapeStringRegexp).join('|')}).*`);
    }

    const queryConditions = [{ [tagsKey]: { $regex: positiveRegexpParts.join('|'), $options: 'i' } }];
    if (allNegativeTokens.size) {
      const negativeRegexp = `^(${[...allNegativeTokens].map(escapeStringRegexp).join('|')})$`;
      queryConditions.push({ [tagsKey]: { $not: { $regex: negativeRegexp, $options: 'i' } } });
    }

    finalQuery = queryConditions.length === 1 ? queryConditions[0] : { $and: queryConditions };
  } else {
    finalQuery = null;
  }

  return {
    isValid: !!finalQuery,
    query: finalQuery,
    positiveTokens: allPositiveTokens,
    negativeTokens: allNegativeTokens
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
      { $match: { [tagsKey]: { $regex: `.*${searchString}.*`, $options: 'i' } } },
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
