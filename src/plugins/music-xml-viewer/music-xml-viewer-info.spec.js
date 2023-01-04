import { beforeEach, describe, expect, it } from 'vitest';
import MusicXmlViewerInfo from './music-xml-viewer-info.js';

describe('music-xml-viewer-info', () => {
  let sut;
  beforeEach(() => {
    sut = new MusicXmlViewerInfo();
  });

  describe('redactContent', () => {
    it('redacts the XML source url', () => {
      const input = {
        sourceUrl: 'cdn://rooms/12345/media/my-song.xml'
      };
      const result = sut.redactContent(input, '67890');
      expect(result.sourceUrl).toBe('');
    });

    it('leaves accessible paths intact', () => {
      const input = {
        sourceUrl: 'cdn://rooms/12345/media/my-song.xml'
      };
      const result = sut.redactContent(input, '12345');
      expect(result).toStrictEqual(input);
    });
  });

  describe('getCdnResources', () => {
    it('returns empty list for an internal resource without url', () => {
      const result = sut.getCdnResources({ sourceUrl: null });
      expect(result).toHaveLength(0);
    });

    it('returns a list with the url for an internal public resource', () => {
      const result = sut.getCdnResources({ sourceUrl: 'cdn://media/12345/some-song.xml' });
      expect(result).toEqual(['cdn://media/12345/some-song.xml']);
    });

    it('returns a list with the url for an internal room-media resource', () => {
      const result = sut.getCdnResources({ sourceUrl: 'cdn://rooms/12345/media/some-song.xml' });
      expect(result).toEqual(['cdn://rooms/12345/media/some-song.xml']);
    });
  });
});
