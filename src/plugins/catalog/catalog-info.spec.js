import CatalogInfo from './catalog-info.js';
import { beforeEach, describe, expect, it } from 'vitest';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

describe('catalog-info', () => {
  let sut;

  const otherRoomId = '67890';
  const currentRoomId = '12345';

  beforeEach(() => {
    sut = new CatalogInfo(new GithubFlavoredMarkdown());
  });

  describe('redactContent', () => {
    it('redacts all unreachable resources', () => {
      const result = sut.redactContent({
        title: `We have a link here: <cdn://room-media/${currentRoomId}/my-file-1.pdf>`,
        items: [
          {
            title: `Some title with [reachable link](cdn://room-media/${otherRoomId}/my-pdf.pdf)`,
            link: { sourceUrl: `cdn://room-media/${otherRoomId}/my-pdf.pdf`, description: `[Click me](cdn://room-media/${otherRoomId}/my-pdf.pdf)` },
            image: { sourceUrl: `cdn://room-media/${otherRoomId}/my-image.png` }
          },
          {
            title: `Some title with [unreachable link](cdn://room-media/${currentRoomId}/my-pdf.pdf)`,
            link: { sourceUrl: `cdn://room-media/${currentRoomId}/my-pdf.pdf`, description: `[Click me](cdn://room-media/${currentRoomId}/my-pdf.pdf)` },
            image: { sourceUrl: `cdn://room-media/${currentRoomId}/my-image.png` }
          }
        ]
      }, otherRoomId);
      expect(result).toStrictEqual({
        title: 'We have a link here: <>',
        items: [
          {
            title: `Some title with [reachable link](cdn://room-media/${otherRoomId}/my-pdf.pdf)`,
            link: { sourceUrl: `cdn://room-media/${otherRoomId}/my-pdf.pdf`, description: `[Click me](cdn://room-media/${otherRoomId}/my-pdf.pdf)` },
            image: { sourceUrl: `cdn://room-media/${otherRoomId}/my-image.png` }
          },
          {
            title: 'Some title with [unreachable link]()',
            link: { sourceUrl: '', description: '[Click me]()' },
            image: { sourceUrl: '' }
          }
        ]
      });
    });
  });

  describe('getCdnResources', () => {
    it('returns a list with all referenced internal URLs', () => {
      const result = sut.getCdnResources({
        title: 'We have a link here: <cdn://media-library/some-pdf-1.png>',
        items: [
          {
            title: 'Some title',
            link: { sourceUrl: 'https://someplace.com/some-page.html', description: 'Some description' },
            image: { sourceUrl: 'cdn://media-library/some-image-1.png' }
          },
          {
            title: 'Some title',
            link: { sourceUrl: 'https://someplace.com/some-page.html', description: 'Some description' },
            image: { sourceUrl: 'cdn://room-media/12345/some-image-2.png' }
          },
          {
            title: 'Some title',
            link: { sourceUrl: 'https://someplace.com/some-page.html', description: 'Some description' },
            image: { sourceUrl: 'https://someplace.com/some-image-3.png' }
          },
          {
            title: 'Some title with link <cdn://media-library/some-audio-1.mp3>',
            link: { sourceUrl: 'https://someplace.com/some-page.html', description: 'Some description' },
            image: { sourceUrl: 'cdn://media-library/some-image-4.png' }
          },
          {
            title: 'Some title',
            link: { sourceUrl: 'cdn://media-library/some-pdf-2.png', description: 'Some description with [link](cdn://media-library/some-pdf-3.png)' },
            image: { sourceUrl: 'cdn://room-media/12345/some-image-5.png' }
          }
        ]
      });
      expect(result).toStrictEqual([
        'cdn://media-library/some-pdf-1.png',
        'cdn://media-library/some-image-1.png',
        'cdn://room-media/12345/some-image-2.png',
        'cdn://media-library/some-audio-1.mp3',
        'cdn://media-library/some-image-4.png',
        'cdn://media-library/some-pdf-3.png',
        'cdn://room-media/12345/some-image-5.png',
        'cdn://media-library/some-pdf-2.png'
      ]);
    });
  });
});
