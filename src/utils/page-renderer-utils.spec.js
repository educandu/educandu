import sut from './page-renderer-utils.js';

describe('page-renderer-utils', () => {
  describe('parseThemeText', () => {
    it('should return the parsed data', () => {
      const text = '<style attr11="value11" attr12="value12">content 1</style><style attr21="value21" attr22="value22">content 2</style>';
      expect(sut.parseThemeText(text)).toEqual([
        {
          attributes: {
            attr11: 'value11',
            attr12: 'value12'
          },
          content: 'content 1'
        },
        {
          attributes: {
            attr21: 'value21',
            attr22: 'value22'
          },
          content: 'content 2'
        }
      ]);
    });
  });
});
