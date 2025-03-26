import { CHAPTER_TYPE } from './constants.js';
import { beforeEach, describe, expect, it } from 'vitest';
import MediaSlideShowInfo from './media-slideshow-info.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

describe('media-slideshow-info', () => {
  let sut;
  let result;
  let content;

  const otherRoomId = '67890';
  const currentRoomId = '12345';

  beforeEach(() => {
    sut = new MediaSlideShowInfo(new GithubFlavoredMarkdown());
  });

  describe('redactContent', () => {
    it('redacts the copyrightNotice', () => {
      content = {
        sourceUrl: '',
        copyrightNotice: `[Click me 1](cdn://room-media/${currentRoomId}/my-file-1.pdf)`,
        chapters: [
          {
            type: CHAPTER_TYPE.image,
            image: {
              sourceUrl: '',
              copyrightNotice: `[Click me 2](cdn://room-media/${currentRoomId}/my-file-2.pdf)`
            },
            text: ''
          }
        ]
      };
      result = sut.redactContent(content, otherRoomId);
      expect(result.copyrightNotice).toBe('[Click me 1]()');
      expect(result.chapters[0].image.copyrightNotice).toBe('[Click me 2]()');
    });

    it('redacts the chapter text', () => {
      content = {
        sourceUrl: '',
        copyrightNotice: '',
        chapters: [
          {
            type: CHAPTER_TYPE.image,
            image: {
              sourceUrl: '',
              copyrightNotice: ''
            },
            text: `[Click me](cdn://room-media/${currentRoomId}/my-file-1.pdf)`
          }
        ]
      };
      result = sut.redactContent(content, otherRoomId);
      expect(result.chapters[0].text).toBe('[Click me]()');
    });

    it('redacts the media source url', () => {
      content = {
        sourceUrl: `room-media/${currentRoomId}/my-video-1.mp4`,
        copyrightNotice: '',
        chapters: [
          {
            type: CHAPTER_TYPE.image,
            image: {
              sourceUrl: `room-media/${currentRoomId}/my-video-2.mp4`,
              copyrightNotice: ''
            },
            text: ''
          }
        ]
      };
      result = sut.redactContent(content, otherRoomId);
      expect(result.sourceUrl).toBe('');
    });

    it('leaves accessible paths intact', () => {
      content = {
        sourceUrl: `room-media/${currentRoomId}/my-video-1.mp4`,
        copyrightNotice: `[Click me 1](cdn://room-media/${currentRoomId}/my-file-1.pdf)`,
        chapters: [
          {
            type: CHAPTER_TYPE.image,
            image: {
              sourceUrl: `room-media/${currentRoomId}/my-video-2.mp4`,
              copyrightNotice: `[Click me 2](cdn://room-media/${currentRoomId}/my-file-2.pdf)`
            },
            text: `[Click me 3](cdn://room-media/${currentRoomId}/my-file-3.pdf)`
          }
        ]
      };
      result = sut.redactContent(content, currentRoomId);
      expect(result).toStrictEqual(content);
    });
  });

  describe('getCdnResources', () => {
    it('returns CDN resources from copyrightNotice', () => {
      content = {
        sourceUrl: '',
        copyrightNotice: 'This [hyperlink](cdn://media-library/my-file-1.pdf) and [another one](https://google.com)',
        chapters: [
          {
            type: CHAPTER_TYPE.image,
            image: {
              sourceUrl: '',
              copyrightNotice: 'This [hyperlink](cdn://media-library/my-file-2.pdf) and [another one](https://google.com)'
            },
            text: ''
          }
        ]
      };
      result = sut.getCdnResources(content);
      expect(result).toStrictEqual([
        'cdn://media-library/my-file-1.pdf',
        'cdn://media-library/my-file-2.pdf'
      ]);
    });

    it('returns CDN resources from chapter text', () => {
      content = {
        sourceUrl: '',
        copyrightNotice: '',
        chapters: [
          {
            type: CHAPTER_TYPE.image,
            image: {
              sourceUrl: '',
              copyrightNotice: ''
            },
            text: 'This [hyperlink](cdn://media-library/my-file-1.pdf) and [another one](https://google.com)'
          }
        ]
      };
      result = sut.getCdnResources(content);
      expect(result).toStrictEqual([
        'cdn://media-library/my-file-1.pdf'
      ]);
    });

    it('returns empty list for a YouTube resource', () => {
      content = {
        sourceUrl: 'https://youtube.com/something-1',
        copyrightNotice: '',
        chapters: [
          {
            type: CHAPTER_TYPE.image,
            image: {
              sourceUrl: 'https://youtube.com/something-2',
              copyrightNotice: ''
            },
            text: ''
          }
        ]
      };
      result = sut.getCdnResources(content);
      expect(result).toHaveLength(0);
    });

    it('returns empty list for an external resource', () => {
      content = {
        sourceUrl: 'https://someplace.com/video-1.mp4',
        copyrightNotice: '',
        chapters: [
          {
            type: CHAPTER_TYPE.image,
            image: {
              sourceUrl: 'https://someplace.com/video-2.mp4',
              copyrightNotice: ''
            },
            text: ''
          }
        ]
      };
      result = sut.getCdnResources(content);
      expect(result).toHaveLength(0);
    });

    it('returns empty list for an internal resource without url', () => {
      content = {
        sourceUrl: null,
        copyrightNotice: '',
        chapters: [
          {
            type: CHAPTER_TYPE.image,
            image: {
              sourceUrl: null,
              copyrightNotice: ''
            },
            text: ''
          }
        ]
      };
      result = sut.getCdnResources(content);
      expect(result).toHaveLength(0);
    });

    it('returns a list with the url for an internal public resource', () => {
      content = {
        sourceUrl: 'cdn://media-library/some-video-1.mp4',
        copyrightNotice: '',
        chapters: [
          {
            type: CHAPTER_TYPE.image,
            image: {
              sourceUrl: 'cdn://media-library/some-video-2.mp4',
              copyrightNotice: ''
            },
            text: ''
          }
        ]
      };
      result = sut.getCdnResources(content);
      expect(result).toEqual([
        'cdn://media-library/some-video-1.mp4',
        'cdn://media-library/some-video-2.mp4'
      ]);
    });

    it('returns a list with the url for an internal room-media resource', () => {
      content = {
        sourceUrl: 'cdn://room-media/12345/some-video-1.mp4',
        copyrightNotice: '',
        chapters: [
          {
            type: CHAPTER_TYPE.image,
            image: {
              sourceUrl: 'cdn://room-media/12345/some-video-2.mp4',
              copyrightNotice: ''
            },
            text: ''
          }
        ]
      };
      result = sut.getCdnResources(content);
      expect(result).toEqual([
        'cdn://room-media/12345/some-video-1.mp4',
        'cdn://room-media/12345/some-video-2.mp4'
      ]);
    });
  });
});
