import { beforeEach, describe, expect, it } from 'vitest';
import MarkdownWithImageInfo from './markdown-with-image-info.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

describe('markdown-with-image-info', () => {
  let sut;
  beforeEach(() => {
    sut = new MarkdownWithImageInfo(new GithubFlavoredMarkdown());
  });

  describe('redactContent', () => {
    it('redacts inaccessible resources', () => {
      const roomId = '12345';
      const targetRoomId = '67890';

      const result = sut.redactContent({
        text: `[Click here](cdn://room-media/${roomId}/file-1.pdf)`,
        image: {
          sourceUrl: `cdn://room-media/${roomId}/image-1.jpeg`,
          copyrightNotice: `[Click here](cdn://room-media/${roomId}/file-2.pdf)`
        }
      }, targetRoomId);
      expect(result).toStrictEqual({
        text: '[Click here]()',
        image: {
          sourceUrl: '',
          copyrightNotice: '[Click here]()'
        }
      });
    });

    it('leaves accessible resources intact', () => {
      const roomId = '12345';

      const result = sut.redactContent({
        text: `[Click here](cdn://room-media/${roomId}/file-1.pdf [and here](cdn://document-media/67890/file-2.pdf)`,
        image: {
          sourceUrl: `cdn://room-media/${roomId}/image-1.jpeg`,
          copyrightNotice: `[Click here](cdn://room-media/${roomId}/file-3.pdf)`
        }
      }, roomId);
      expect(result).toStrictEqual({
        text: `[Click here](cdn://room-media/${roomId}/file-1.pdf [and here](cdn://document-media/67890/file-2.pdf)`,
        image: {
          sourceUrl: `cdn://room-media/${roomId}/image-1.jpeg`,
          copyrightNotice: `[Click here](cdn://room-media/${roomId}/file-3.pdf)`
        }
      });
    });
  });

  describe('getCdnResources', () => {
    it('returns internal resources from text and copyrightNotice props', () => {
      const result = sut.getCdnResources({
        text: '[Click here](cdn://room-media/12345/file-1.pdf) [and here](cdn://document-media/67890/file-2.pdf)',
        image: {
          sourceUrl: 'cdn://document-media/67890/image-1.jpeg',
          copyrightNotice: '[Click here](cdn://room-media/12345/file-3.pdf)'
        }
      });
      expect(result).toStrictEqual([
        'cdn://room-media/12345/file-1.pdf',
        'cdn://document-media/67890/file-2.pdf',
        'cdn://room-media/12345/file-3.pdf',
        'cdn://document-media/67890/image-1.jpeg'
      ]);
    });

    it('returns empty list for external resources', () => {
      const result = sut.getCdnResources({
        text: '[Click here](https://someplace.com/file-1.pdf)',
        image: {
          sourceUrl: 'https://someplace.com/image-1.jpeg',
          copyrightNotice: '[Click here](https://someplace.com/file-2.pdf)'
        }
      });
      expect(result).toHaveLength(0);
    });

    it('returns empty list for resource without url', () => {
      const result = sut.getCdnResources({
        text: '[Click here]()',
        image: {
          sourceUrl: null,
          copyrightNotice: '[Click here]()'
        }
      });
      expect(result).toHaveLength(0);
    });
  });
});
