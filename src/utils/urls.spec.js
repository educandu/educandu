import sut from './urls';

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

});
