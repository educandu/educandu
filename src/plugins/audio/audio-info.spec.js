import AudioInfo from './audio-info.js';
import { beforeEach, describe, expect, it } from 'vitest';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

describe('audio-info', () => {
  let sut;

  beforeEach(() => {
    sut = new AudioInfo(new GithubFlavoredMarkdown());
  });

  describe('redactContent', () => {
    it('redacts private resources from different rooms', () => {
      const result = sut.redactContent({
        sourceUrl: 'cdn://rooms/12345/media/some-sound.mp3',
        copyrightNotice: '[Click here](cdn://rooms/12345/media/some-doc.pdf)'
      }, '67890');
      expect(result).toStrictEqual({
        sourceUrl: '',
        copyrightNotice: '[Click here]()'
      });
    });

    it('leaves private resources from the same room intact', () => {
      const result = sut.redactContent({
        sourceUrl: 'cdn://rooms/12345/media/some-sound.mp3',
        copyrightNotice: '[Click here](cdn://rooms/12345/media/some-doc.pdf)'
      }, '12345');
      expect(result).toStrictEqual({
        sourceUrl: 'cdn://rooms/12345/media/some-sound.mp3',
        copyrightNotice: '[Click here](cdn://rooms/12345/media/some-doc.pdf)'
      });
    });

    it('leaves public resources intact', () => {
      const result = sut.redactContent({
        sourceUrl: 'cdn://media/12345/some-sound.mp3',
        copyrightNotice: '[Click here](cdn://media/12345/some-doc.pdf)'
      }, '12345');
      expect(result).toStrictEqual({
        sourceUrl: 'cdn://media/12345/some-sound.mp3',
        copyrightNotice: '[Click here](cdn://media/12345/some-doc.pdf)'
      });
    });
  });

  describe('getCdnResources', () => {
    it('returns resources from the copyrightNotice', () => {
      const result = sut.getCdnResources({ sourceUrl: null, copyrightNotice: '[Hyperlink](cdn://media/my-file.pdf)' });
      expect(result).toStrictEqual(['cdn://media/my-file.pdf']);
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
      const result = sut.getCdnResources({ sourceUrl: 'cdn://media/12345/some-sound.mp3', copyrightNotice: '' });
      expect(result).toEqual(['cdn://media/12345/some-sound.mp3']);
    });

    it('returns a list with the url for an internal private resource', () => {
      const result = sut.getCdnResources({ sourceUrl: 'cdn://rooms/12345/media/some-sound.mp3', copyrightNotice: '' });
      expect(result).toEqual(['cdn://rooms/12345/media/some-sound.mp3']);
    });
  });
});
