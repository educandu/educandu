import { SOURCE_TYPE } from './constants.js';
import MusicXmlViewerInfo from './music-xml-viewer-info.js';

describe('music-xml-viewer-info', () => {
  let sut;
  beforeEach(() => {
    sut = new MusicXmlViewerInfo();
  });

  describe('redactContent', () => {
    it('redacts the PDF source url', () => {
      const input = {
        sourceType: SOURCE_TYPE.internal,
        sourceUrl: 'rooms/12345/media/my-song.xml'
      };
      const result = sut.redactContent(input, '67890');
      expect(result.sourceUrl).toBe('');
    });

    it('leaves accessible paths intact', () => {
      const input = {
        sourceType: SOURCE_TYPE.internal,
        sourceUrl: 'rooms/12345/media/my-song.xml'
      };
      const result = sut.redactContent(input, '12345');
      expect(result).toStrictEqual(input);
    });
  });

  describe('getCdnResources', () => {
    it('returns empty list for an internal resource without url', () => {
      const result = sut.getCdnResources({ sourceType: SOURCE_TYPE.internal, sourceUrl: null });
      expect(result).toHaveLength(0);
    });
    it('returns a list with the url for an internal resource', () => {
      const result = sut.getCdnResources({ sourceType: SOURCE_TYPE.internal, sourceUrl: 'media/some-song.xml' });
      expect(result).toEqual(['media/some-song.xml']);
    });
  });
});
