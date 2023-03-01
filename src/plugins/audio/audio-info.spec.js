import AudioInfo from './audio-info.js';
import { beforeEach, describe, expect, it } from 'vitest';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

describe('audio-info', () => {
  let sut;

  beforeEach(() => {
    sut = new AudioInfo(new GithubFlavoredMarkdown());
  });

  describe('redactContent', () => {
    it('redacts room-media resources from different rooms', () => {
      const result = sut.redactContent({
        sourceUrl: 'cdn://room-media/12345/some-sound.mp3',
        copyrightNotice: '[Click here](cdn://room-media/12345/some-doc.pdf)'
      }, '67890');
      expect(result).toStrictEqual({
        sourceUrl: '',
        copyrightNotice: '[Click here]()'
      });
    });

    it('leaves room-media resources from the same room intact', () => {
      const result = sut.redactContent({
        sourceUrl: 'cdn://room-media/12345/some-sound.mp3',
        copyrightNotice: '[Click here](cdn://room-media/12345/some-doc.pdf)'
      }, '12345');
      expect(result).toStrictEqual({
        sourceUrl: 'cdn://room-media/12345/some-sound.mp3',
        copyrightNotice: '[Click here](cdn://room-media/12345/some-doc.pdf)'
      });
    });

    it('leaves non room-media resources intact', () => {
      const result = sut.redactContent({
        sourceUrl: 'cdn://media-library/some-sound.mp3',
        copyrightNotice: '[Click here](cdn://media-library/some-doc.pdf)'
      }, '12345');
      expect(result).toStrictEqual({
        sourceUrl: 'cdn://media-library/some-sound.mp3',
        copyrightNotice: '[Click here](cdn://media-library/some-doc.pdf)'
      });
    });
  });

  describe('getCdnResources', () => {
    it('returns resources from the copyrightNotice', () => {
      const result = sut.getCdnResources({ sourceUrl: null, copyrightNotice: '[Hyperlink](cdn://media-library/my-file.pdf)' });
      expect(result).toStrictEqual(['cdn://media-library/my-file.pdf']);
    });

    it('returns empty list for an external resource', () => {
      const result = sut.getCdnResources({ sourceUrl: 'https://someplace.com/sound.mp3', copyrightNotice: '' });
      expect(result).toHaveLength(0);
    });

    it('returns empty list for an internal resource without url', () => {
      const result = sut.getCdnResources({ sourceUrl: null, copyrightNotice: '' });
      expect(result).toHaveLength(0);
    });

    it('returns a list with the url for an internal public resource', () => {
      const result = sut.getCdnResources({ sourceUrl: 'cdn://media-library/some-sound.mp3', copyrightNotice: '' });
      expect(result).toEqual(['cdn://media-library/some-sound.mp3']);
    });

    it('returns a list with the url for an internal room-media resource', () => {
      const result = sut.getCdnResources({ sourceUrl: 'cdn://room-media/12345/some-sound.mp3', copyrightNotice: '' });
      expect(result).toEqual(['cdn://room-media/12345/some-sound.mp3']);
    });
  });
});
