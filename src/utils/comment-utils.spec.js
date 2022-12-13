import { groupCommentsByTopic } from './comment-utils.js';
import { beforeEach, describe, expect, it } from 'vitest';

describe('comment-utils', () => {
  let result;

  describe('groupCommentsByTopic', () => {
    describe('when comments are empty string', () => {
      beforeEach(() => {
        result = groupCommentsByTopic([]);
      });
      it('should return empty object', () => {
        expect(result).toEqual({});
      });
    });

    describe('when comments of multiple topics are provided', () => {
      let comments;
      beforeEach(() => {
        comments = [
          { _id: 11, topic: 'topic-1', createdOn: new Date() },
          { _id: 12, topic: 'topic-1', createdOn: new Date() },
          { _id: 21, topic: 'topic-2', createdOn: new Date() },
          { _id: 22, topic: 'topic-2', createdOn: new Date() }
        ];
        result = groupCommentsByTopic(comments);
      });
      it('should return a grouping sorted by most recently created topics ascending and within each topic the comments sorted descending by createdOn', () => {
        expect(result).toEqual({
          'topic-2': [comments[2], comments[3]],
          'topic-1': [comments[0], comments[1]]
        });
      });
    });
  });
});
