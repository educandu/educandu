import { cssQuote, cssUrl } from './css-utils.js';

describe('css-utils', () => {

  describe('cssQuote', () => {
    it('should properly quote the input', () => {
      expect(cssQuote('testing')).toEqual('"testing"');
    });
    it('should escape special characters', () => {
      expect(cssQuote('"')).toEqual('"\\""');
    });
  });

  describe('cssUrl', () => {
    it('should produce proper url rules', () => {
      expect(cssUrl('/path.png')).toEqual('url("/path.png")');
    });
  });

});
