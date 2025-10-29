import { createQueryParser } from './sorting-hooks.js';
import { beforeEach, describe, expect, it } from 'vitest';

describe('sorting-hooks', () => {

  describe('createQueryParser', () => {

    describe('with simple sorter names', () => {
      let parser;

      beforeEach(() => {
        const sorters = [
          { name: 'tag' },
          { name: 'createdOn' },
          { name: 'createdBy' }
        ];
        parser = createQueryParser(sorters);
      });

      it('should parse a single name-direction pair', () => {
        const result = parser('tag~asc');
        expect(result).toEqual([['tag', 'asc']]);
      });

      it('should parse multiple name-direction pairs', () => {
        const result = parser('tag~asc~createdOn~desc~createdBy~desc');
        expect(result).toEqual([['tag', 'asc'], ['createdOn', 'desc'], ['createdBy', 'desc']]);
      });

      it('should parse with all ascending directions', () => {
        const result = parser('tag~asc~createdOn~asc');
        expect(result).toEqual([['tag', 'asc'], ['createdOn', 'asc']]);
      });

      it('should parse with all descending directions', () => {
        const result = parser('tag~desc~createdOn~desc');
        expect(result).toEqual([['tag', 'desc'], ['createdOn', 'desc']]);
      });

      it('should return null for empty string', () => {
        const result = parser('');
        expect(result).toBeNull();
      });

      it('should return null for null input', () => {
        const result = parser(null);
        expect(result).toBeNull();
      });

      it('should return null for undefined input', () => {
        // eslint-disable-next-line no-undefined
        const result = parser(undefined);
        expect(result).toBeNull();
      });

      it('should return null for invalid sorter name', () => {
        const result = parser('invalidName~asc');
        expect(result).toBeNull();
      });

      it('should return null for invalid direction', () => {
        const result = parser('tag~invalid');
        expect(result).toBeNull();
      });

      it('should ignore incomplete pair (missing direction)', () => {
        const result = parser('tag~asc~createdOn');
        expect(result).toEqual([['tag', 'asc']]);
      });

      it('should ignore trailing separator', () => {
        const result = parser('tag~asc~');
        expect(result).toEqual([['tag', 'asc']]);
      });

      it('should ignore leading content before first valid pair', () => {
        const result = parser('~tag~asc');
        expect(result).toEqual([['tag', 'asc']]);
      });

      it('should return null for query with wrong separator', () => {
        const result = parser('tag-asc');
        expect(result).toBeNull();
      });
    });

    describe('with sorter names containing special regex characters', () => {
      let parser;

      beforeEach(() => {
        const sorters = [
          { name: 'tag.name' },
          { name: 'count+1' },
          { name: 'size*factor' },
          { name: 'value(x)' },
          { name: 'range[0]' },
          { name: 'pattern^start' },
          { name: 'end$pattern' },
          { name: 'any?char' },
          { name: 'group|or' },
          { name: 'escape\\char' }
        ];
        parser = createQueryParser(sorters);
      });

      it('should parse sorter name with dot', () => {
        const result = parser('tag.name~asc');
        expect(result).toEqual([['tag.name', 'asc']]);
      });

      it('should parse sorter name with plus', () => {
        const result = parser('count+1~desc');
        expect(result).toEqual([['count+1', 'desc']]);
      });

      it('should parse sorter name with asterisk', () => {
        const result = parser('size*factor~asc');
        expect(result).toEqual([['size*factor', 'asc']]);
      });

      it('should parse sorter name with parentheses', () => {
        const result = parser('value(x)~desc');
        expect(result).toEqual([['value(x)', 'desc']]);
      });

      it('should parse sorter name with square brackets', () => {
        const result = parser('range[0]~asc');
        expect(result).toEqual([['range[0]', 'asc']]);
      });

      it('should parse sorter name with caret', () => {
        const result = parser('pattern^start~desc');
        expect(result).toEqual([['pattern^start', 'desc']]);
      });

      it('should parse sorter name with dollar sign', () => {
        const result = parser('end$pattern~asc');
        expect(result).toEqual([['end$pattern', 'asc']]);
      });

      it('should parse sorter name with question mark', () => {
        const result = parser('any?char~desc');
        expect(result).toEqual([['any?char', 'desc']]);
      });

      it('should parse sorter name with pipe', () => {
        const result = parser('group|or~asc');
        expect(result).toEqual([['group|or', 'asc']]);
      });

      it('should parse sorter name with backslash', () => {
        const result = parser('escape\\char~desc');
        expect(result).toEqual([['escape\\char', 'desc']]);
      });

      it('should parse multiple sorter names with special characters', () => {
        const result = parser('tag.name~asc~count+1~desc~range[0]~asc');
        expect(result).toEqual([['tag.name', 'asc'], ['count+1', 'desc'], ['range[0]', 'asc']]);
      });
    });

    describe('with edge cases', () => {
      it('should handle sorter names that are substrings of each other', () => {
        const sorters = [
          { name: 'tag' },
          { name: 'tagName' },
          { name: 'tagNameLong' }
        ];
        const parser = createQueryParser(sorters);

        expect(parser('tag~asc')).toEqual([['tag', 'asc']]);
        expect(parser('tagName~asc')).toEqual([['tagName', 'asc']]);
        expect(parser('tagNameLong~asc')).toEqual([['tagNameLong', 'asc']]);
        expect(parser('tag~asc~tagName~desc')).toEqual([['tag', 'asc'], ['tagName', 'desc']]);
      });

      it('should return null for empty sorters array', () => {
        const parser = createQueryParser([]);
        const result = parser('anything~asc');
        expect(result).toBeNull();
      });

      it('should handle single sorter', () => {
        const sorters = [{ name: 'only' }];
        const parser = createQueryParser(sorters);

        expect(parser('only~asc')).toEqual([['only', 'asc']]);
        expect(parser('only~desc')).toEqual([['only', 'desc']]);
        expect(parser('other~asc')).toBeNull();
      });

      it('should handle very long query strings', () => {
        const sorters = [
          { name: 'a' },
          { name: 'b' },
          { name: 'c' }
        ];
        const parser = createQueryParser(sorters);

        const result = parser('a~asc~b~desc~c~asc~a~desc~b~asc');
        expect(result).toEqual([
          ['a', 'asc'],
          ['b', 'desc'],
          ['c', 'asc'],
          ['a', 'desc'],
          ['b', 'asc']
        ]);
      });

      it('should ignore whitespace and extract valid pairs', () => {
        const sorters = [{ name: 'tag' }];
        const parser = createQueryParser(sorters);

        expect(parser('tag ~asc')).toBeNull();
        expect(parser('tag~ asc')).toBeNull();
        expect(parser(' tag~asc')).toEqual([['tag', 'asc']]);
        expect(parser('tag~asc ')).toEqual([['tag', 'asc']]);
      });
    });

  });

});
