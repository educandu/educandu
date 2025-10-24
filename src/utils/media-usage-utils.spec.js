import { beforeEach, describe, expect, it } from 'vitest';
import { usageFilterValueToUsageFilterMap, usageFilterMapToUsageFilterValue, usageFilterValueToRegExp } from './media-usage-utils.js';

describe('media-usage-utils', () => {
  describe('usageFilterValueToUsageFilterMap', () => {
    describe('when given a valid filter string with all keys', () => {
      it('converts the filter string to a map object', () => {
        const result = usageFilterValueToUsageFilterMap('XnDyHyAiCnUnSnRi');

        expect(result).toEqual({
          X: 'n',
          D: 'y',
          H: 'y',
          A: 'i',
          C: 'n',
          U: 'n',
          S: 'n',
          R: 'i'
        });
      });
    });

    describe('when given a valid filter string with only some keys', () => {
      it('converts specified keys and defaults others to indeterminate', () => {
        const result = usageFilterValueToUsageFilterMap('DyHy');

        expect(result).toEqual({
          X: 'i',
          D: 'y',
          H: 'y',
          A: 'i',
          C: 'i',
          U: 'i',
          S: 'i',
          R: 'i'
        });
      });
    });

    describe('when given an empty string', () => {
      it('returns all keys set to indeterminate', () => {
        const result = usageFilterValueToUsageFilterMap('');

        expect(result).toEqual({
          X: 'i',
          D: 'i',
          H: 'i',
          A: 'i',
          C: 'i',
          U: 'i',
          S: 'i',
          R: 'i'
        });
      });
    });

    describe('when given a filter string with all criteria values', () => {
      it('handles yes, no, and indeterminate values', () => {
        const result = usageFilterValueToUsageFilterMap('XyDnHi');

        expect(result.X).toBe('y');
        expect(result.D).toBe('n');
        expect(result.H).toBe('i');
      });
    });

    describe('when given an invalid usage key', () => {
      it('throws an error', () => {
        expect(() => {
          usageFilterValueToUsageFilterMap('ZyDy');
        }).toThrow('Invalid filter value \'ZyDy\'');
      });
    });

    describe('when given an invalid criteria value', () => {
      it('throws an error', () => {
        expect(() => {
          usageFilterValueToUsageFilterMap('XzDy');
        }).toThrow('Invalid filter value \'XzDy\'');
      });
    });

    describe('when keys are specified multiple times', () => {
      it('uses the last value specified', () => {
        const result = usageFilterValueToUsageFilterMap('DyDnDi');

        expect(result.D).toBe('i');
      });
    });
  });

  describe('usageFilterMapToUsageFilterValue', () => {
    describe('when given a valid filter map', () => {
      it('converts the map to a filter string', () => {
        const filterMap = {
          X: 'n',
          D: 'y',
          H: 'y',
          A: 'i',
          C: 'n',
          U: 'n',
          S: 'n',
          R: 'i'
        };

        const result = usageFilterMapToUsageFilterValue(filterMap);

        expect(result).toBe('XnDyHyAiCnUnSnRi');
      });
    });

    describe('when given a filter map with all indeterminate values', () => {
      it('creates a filter string with all indeterminate', () => {
        const filterMap = {
          X: 'i',
          D: 'i',
          H: 'i',
          A: 'i',
          C: 'i',
          U: 'i',
          S: 'i',
          R: 'i'
        };

        const result = usageFilterMapToUsageFilterValue(filterMap);

        expect(result).toBe('XiDiHiAiCiUiSiRi');
      });
    });

    describe('when given a filter map with all yes values', () => {
      it('creates a filter string with all yes', () => {
        const filterMap = {
          X: 'y',
          D: 'y',
          H: 'y',
          A: 'y',
          C: 'y',
          U: 'y',
          S: 'y',
          R: 'y'
        };

        const result = usageFilterMapToUsageFilterValue(filterMap);

        expect(result).toBe('XyDyHyAyCyUySyRy');
      });
    });

    describe('when given a filter map with an invalid criteria value', () => {
      it('throws an error', () => {
        const filterMap = {
          X: 'z',
          D: 'y',
          H: 'y',
          A: 'i',
          C: 'n',
          U: 'n',
          S: 'n',
          R: 'i'
        };

        expect(() => {
          usageFilterMapToUsageFilterValue(filterMap);
        }).toThrow('Invalid filter criteria value \'z\'');
      });
    });

    describe('when converting back and forth', () => {
      it('maintains the same values', () => {
        const original = 'XnDyHyAiCnUnSnRi';
        const map = usageFilterValueToUsageFilterMap(original);
        const result = usageFilterMapToUsageFilterValue(map);

        expect(result).toBe(original);
      });
    });
  });

  describe('usageFilterValueToRegExp', () => {
    let regexp;

    describe('when given a filter with all yes values', () => {
      beforeEach(() => {
        regexp = usageFilterValueToRegExp('XyDyHyAyCyUySyRy');
      });

      it('creates a regex that requires all keys', () => {
        expect(regexp.source).toBe('^XDHACUSR$');
      });

      it('matches a usage string with all keys', () => {
        expect(regexp.test('XDHACUSR')).toBe(true);
      });

      it('does not match a usage string missing any key', () => {
        expect(regexp.test('DHACUSR')).toBe(false);
        expect(regexp.test('XDACUSR')).toBe(false);
      });
    });

    describe('when given a filter with all no values', () => {
      beforeEach(() => {
        regexp = usageFilterValueToRegExp('XnDnHnAnCnUnSnRn');
      });

      it('creates a regex that requires no keys', () => {
        expect(regexp.source).toBe('^$');
      });

      it('matches an empty string', () => {
        expect(regexp.test('')).toBe(true);
      });

      it('does not match any usage string with keys', () => {
        expect(regexp.test('D')).toBe(false);
        expect(regexp.test('X')).toBe(false);
      });
    });

    describe('when given a filter with specific yes values', () => {
      beforeEach(() => {
        regexp = usageFilterValueToRegExp('XnDyHyAnCnUnSnRn');
      });

      it('creates a regex requiring only those keys', () => {
        expect(regexp.source).toBe('^DH$');
      });

      it('matches a usage string with exactly those keys', () => {
        expect(regexp.test('DH')).toBe(true);
      });

      it('does not match with missing keys', () => {
        expect(regexp.test('D')).toBe(false);
        expect(regexp.test('H')).toBe(false);
      });

      it('does not match with extra keys', () => {
        expect(regexp.test('DHC')).toBe(false);
        expect(regexp.test('DHCU')).toBe(false);
      });
    });

    describe('when given a filter with indeterminate values', () => {
      beforeEach(() => {
        regexp = usageFilterValueToRegExp('XnDyHyAiCyUnSnRn');
      });

      it('creates a regex with optional keys for indeterminate', () => {
        expect(regexp.source).toBe('^DHA?C$');
      });

      it('matches with the indeterminate key present', () => {
        expect(regexp.test('DHAC')).toBe(true);
      });

      it('matches with the indeterminate key absent', () => {
        expect(regexp.test('DHC')).toBe(true);
      });

      it('does not match without required keys', () => {
        expect(regexp.test('DAC')).toBe(false);
        expect(regexp.test('HAC')).toBe(false);
      });

      it('does not match with excluded keys', () => {
        expect(regexp.test('DHACU')).toBe(false);
        expect(regexp.test('DHACR')).toBe(false);
      });
    });

    describe('when given a complex filter', () => {
      beforeEach(() => {
        // X=no, D=yes, H=yes, A=indeterminate, C=yes, U=no, S=no, R=indeterminate
        regexp = usageFilterValueToRegExp('XnDyHyAiCyUnSnRi');
      });

      it('creates the correct regex pattern', () => {
        expect(regexp.source).toBe('^DHA?CR?$');
      });

      it('matches DHC (required keys only)', () => {
        expect(regexp.test('DHC')).toBe(true);
      });

      it('matches DHAC (with first optional key)', () => {
        expect(regexp.test('DHAC')).toBe(true);
      });

      it('matches DHCR (with second optional key)', () => {
        expect(regexp.test('DHCR')).toBe(true);
      });

      it('matches DHACR (with both optional keys)', () => {
        expect(regexp.test('DHACR')).toBe(true);
      });

      it('does not match with excluded keys', () => {
        expect(regexp.test('XDHC')).toBe(false);
        expect(regexp.test('DHCU')).toBe(false);
        expect(regexp.test('DHCS')).toBe(false);
      });

      it('does not match with missing required keys', () => {
        expect(regexp.test('DC')).toBe(false);
        expect(regexp.test('HC')).toBe(false);
        expect(regexp.test('DH')).toBe(false);
      });
    });

    describe('when given an invalid filter value', () => {
      it('throws an error from usageFilterValueToUsageFilterMap', () => {
        expect(() => {
          usageFilterValueToRegExp('ZyDy');
        }).toThrow('Invalid filter value \'ZyDy\'');
      });
    });
  });
});
