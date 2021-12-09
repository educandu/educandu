import sut from './urls.js';

describe('order-store-base', () => {

  describe('removeTrailingSlash', () => {

    const testCases = [
      {
        description: 'when called with a path without trailing slashes',
        expectation: 'should return the input value',
        path: '/some-path/some-other-path',
        expectedResult: '/some-path/some-other-path'
      },
      {
        description: 'when called with a path with one trailing slash',
        expectation: 'should remove the trailing slash',
        path: '/some-path/some-other-path/',
        expectedResult: '/some-path/some-other-path'
      },
      {
        description: 'when called with a path with multiple trailing slashes',
        expectation: 'should remove all trailing slashes',
        path: '/some-path/some-other-path///',
        expectedResult: '/some-path/some-other-path'
      }
    ];

    testCases.forEach(({ description, expectation, path, expectedResult }) => {
      describe(description, () => {
        let actualResult;
        beforeEach(() => {
          actualResult = sut.removeTrailingSlash(path);
        });
        it(expectation, () => {
          expect(actualResult).toBe(expectedResult);
        });
      });
    });

  });

  describe('removeLeadingSlash', () => {

    const testCases = [
      {
        description: 'when called with a path without leading slashes',
        expectation: 'should return the input value',
        path: 'some-path/some-other-path/',
        expectedResult: 'some-path/some-other-path/'
      },
      {
        description: 'when called with a path with one leading slash',
        expectation: 'should remove the leading slash',
        path: '/some-path/some-other-path/',
        expectedResult: 'some-path/some-other-path/'
      },
      {
        description: 'when called with a path with multiple leading slashes',
        expectation: 'should remove all leading slashes',
        path: '///some-path/some-other-path/',
        expectedResult: 'some-path/some-other-path/'
      }
    ];

    testCases.forEach(({ description, expectation, path, expectedResult }) => {
      describe(description, () => {
        let actualResult;
        beforeEach(() => {
          actualResult = sut.removeLeadingSlash(path);
        });
        it(expectation, () => {
          expect(actualResult).toBe(expectedResult);
        });
      });
    });

  });

  describe('concatParts', () => {
    const testCases = [
      {
        description: 'when called with multiple parts',
        expectation: 'should return the right url',
        parts: ['abc', 'def', 'ghi'],
        expectedResult: 'abc/def/ghi'
      },
      {
        description: 'when called with a 0 part',
        expectation: 'should return the right url',
        parts: ['abc', 0, 'ghi'],
        expectedResult: 'abc/0/ghi'
      },
      {
        description: 'when called with a false part',
        expectation: 'should return the right url',
        parts: ['abc', false, 'ghi'],
        expectedResult: 'abc/false/ghi'
      },
      {
        description: 'when called with a null part',
        expectation: 'should return the right url',
        parts: ['abc', null, 'ghi'],
        expectedResult: 'abc/ghi'
      },
      {
        description: 'when called with an empty string part',
        expectation: 'should return the right url',
        parts: ['abc', '', 'ghi'],
        expectedResult: 'abc/ghi'
      }
    ];

    testCases.forEach(({ description, expectation, parts, expectedResult }) => {
      describe(description, () => {
        let actualResult;
        beforeEach(() => {
          actualResult = sut.concatParts(...parts);
        });
        it(expectation, () => {
          expect(actualResult).toBe(expectedResult);
        });
      });
    });

  });

});
