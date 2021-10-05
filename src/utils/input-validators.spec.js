import sut from './input-validators';

describe('input-validators', () => {

  describe('isValidPassword', () => {
    let result;

    const testCases = [
      { password: null, minLength: 4, expectedResult: false },
      { password: 'abc', minLength: 4, expectedResult: false },
      { password: 'abcd', minLength: 4, expectedResult: false },
      { password: 'abc1', expectedResult: false },
      { password: 'abc1', minLength: 4, expectedResult: true },
      { password: '__a1', minLength: 4, expectedResult: true },
      { password: 'abcd123', expectedResult: false },
      { password: 'abcd1234', expectedResult: true }
    ];

    testCases.forEach(({ password, minLength, expectedResult }) => {
      describe(`with password='${password}' and minLength=${minLength}`, () => {
        beforeEach(() => {
          result = sut.isValidPassword({ password, minLength });
        });
        it(`should return ${expectedResult}`, () => {
          expect(result).toBe(expectedResult);
        });
      });
    });
  });

});
