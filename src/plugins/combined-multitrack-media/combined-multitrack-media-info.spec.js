import { beforeEach, describe, expect, it } from 'vitest';
import CombinedMultitrackMediaInfo from './combined-multitrack-media-info.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

describe('combined-multitrack-media-info', () => {
  let sut;
  let result;
  let content;

  const otherRoomId = '67890';
  const currentRoomId = '12345';

  beforeEach(() => {
    sut = new CombinedMultitrackMediaInfo(new GithubFlavoredMarkdown());
  });

  describe('redactContent', () => {
    it('redacts the note', () => {
      content = {
        player1: {
          track: {
            copyrightNotice: ''
          },
          posterImage: {
            sourceUrl: ''
          }
        },
        player2: {
          tracks: [
            {
              copyrightNotice: ''
            },
            {
              copyrightNotice: ''
            }
          ]
        },
        note: `[Click me](cdn://room-media/${currentRoomId}/my-file-1.pdf)`
      };
      result = sut.redactContent(content, otherRoomId);
      expect(result.note).toBe('[Click me]()');
    });

    it('redacts the copyrightNotice', () => {
      content = {
        player1: {
          track: {
            copyrightNotice: `[Click me](cdn://room-media/${currentRoomId}/my-file-1.pdf)`
          },
          posterImage: {
            sourceUrl: ''
          }
        },
        player2: {
          tracks: [
            {
              copyrightNotice: `[Click me](cdn://room-media/${currentRoomId}/my-file-2.pdf)`
            },
            {
              copyrightNotice: `[Click me too](cdn://room-media/${currentRoomId}/my-file-3.pdf)`
            }
          ]
        },
        note: ''
      };
      result = sut.redactContent(content, otherRoomId);
      expect(result.player1.track.copyrightNotice).toBe('[Click me]()');
      expect(result.player2.tracks[0].copyrightNotice).toBe('[Click me]()');
      expect(result.player2.tracks[1].copyrightNotice).toBe('[Click me too]()');
    });

    it('redacts the media source url', () => {
      content = {
        player1: {
          track: {
            sourceUrl: `cdn://room-media/${currentRoomId}/my-video-1.mp4`,
            copyrightNotice: ''
          },
          posterImage: {
            sourceUrl: `cdn://room-media/${currentRoomId}/my-photo.jpeg`
          }
        },
        player2: {
          tracks: [
            {
              sourceUrl: `cdn://room-media/${currentRoomId}/my-video-2.mp4`,
              copyrightNotice: ''
            },
            {
              sourceUrl: `cdn://room-media/${currentRoomId}/my-video-3.mp4`,
              copyrightNotice: ''
            }
          ]
        },
        note: ''
      };
      result = sut.redactContent(content, otherRoomId);
      expect(result.player1.track.sourceUrl).toBe('');
      expect(result.player1.posterImage.sourceUrl).toBe('');
      expect(result.player2.tracks[0].sourceUrl).toBe('');
      expect(result.player2.tracks[1].sourceUrl).toBe('');
    });

    it('redacts the poster image source url', () => {
      content = {
        player1: {
          track:
          {
            sourceUrl: '',
            copyrightNotice: ''
          },
          posterImage: {
            sourceUrl: `cdn://room-media/${currentRoomId}/my-image.jpg`
          }
        },
        player2: {
          tracks: []
        },
        note: ''
      };
      result = sut.redactContent(content, otherRoomId);
      expect(result.player1.posterImage.sourceUrl).toBe('');
    });

    it('leaves accessible paths intact', () => {
      content = {
        player1: {
          track: {
            sourceUrl: `cdn://room-media/${currentRoomId}/my-video-1.mp4`,
            copyrightNotice: `[Click me](cdn://room-media/${currentRoomId}/my-file-1.pdf)`
          },
          posterImage: {
            sourceUrl: `cdn://room-media/${currentRoomId}/my-photo.jpeg`
          }
        },
        player2: {
          tracks: [
            {
              sourceUrl: `cdn://room-media/${currentRoomId}/my-video-2.mp4`,
              copyrightNotice: `[Click me](cdn://room-media/${currentRoomId}/my-file-1.pdf)`
            },
            {
              sourceUrl: `cdn://room-media/${currentRoomId}/my-video-3.mp4`,
              copyrightNotice: `[Click me](cdn://room-media/${currentRoomId}/my-file-1.pdf)`
            }
          ]
        },
        note: `[Click me](cdn://room-media/${currentRoomId}/my-file-1.pdf)`
      };
      result = sut.redactContent(content, currentRoomId);
      expect(result).toStrictEqual(content);
    });
  });

  describe('getCdnResources', () => {
    it('returns CDN resources from note', () => {
      content = {
        player1: {
          track: {
            sourceUrl: '',
            copyrightNotice: ''
          },
          posterImage: {
            sourceUrl: ''
          }
        },
        player2: {
          tracks: [
            {
              sourceUrl: '',
              copyrightNotice: ''
            },
            {
              sourceUrl: '',
              copyrightNotice: ''
            }
          ]
        },
        note: 'This [hyperlink](cdn://media-library/my-file-1.pdf) and [another one](https://google.com)'
      };
      result = sut.getCdnResources(content);
      expect(result).toStrictEqual([
        'cdn://media-library/my-file-1.pdf'
      ]);
    });

    it('returns CDN resources from copyrightNotice', () => {
      content = {
        player1: {
          track: {
            sourceUrl: '',
            copyrightNotice: 'This [hyperlink](cdn://media-library/my-file-1.pdf) and [another one](https://google.com)'
          },
          posterImage: {
            sourceUrl: ''
          }
        },
        player2: {
          tracks: [
            {
              sourceUrl: '',
              copyrightNotice: 'This [hyperlink](cdn://media-library/my-file-2.pdf) and [another one](https://google.com)'
            },
            {
              sourceUrl: '',
              copyrightNotice: 'This [hyperlink](cdn://media-library/my-file-3.pdf) and [another one](https://google.com)'
            }
          ]
        },
        note: ''
      };
      result = sut.getCdnResources(content);
      expect(result).toStrictEqual([
        'cdn://media-library/my-file-1.pdf',
        'cdn://media-library/my-file-2.pdf',
        'cdn://media-library/my-file-3.pdf'
      ]);
    });

    it('returns empty list for a YouTube resource', () => {
      content = {
        player1: {
          track: {
            sourceUrl: 'https://youtube.com/something',
            copyrightNotice: ''
          },
          posterImage: {
            sourceUrl: ''
          }
        },
        player2: {
          tracks: [
            {
              sourceUrl: 'https://youtube.com/something',
              copyrightNotice: ''
            },
            {
              sourceUrl: 'https://youtube.com/something',
              copyrightNotice: ''
            }
          ]
        },
        note: ''
      };
      result = sut.getCdnResources(content);
      expect(result).toHaveLength(0);
    });

    it('returns empty list for an external resource', () => {
      content = {
        player1: {
          track: {
            sourceUrl: 'https://someplace.com/video.mp',
            copyrightNotice: ''
          },
          posterImage: {
            sourceUrl: 'https://someplace.com/image.jpg'
          }
        },
        player2: {
          tracks: [
            {
              sourceUrl: 'https://someplace.com/video.mp',
              copyrightNotice: ''
            },
            {
              sourceUrl: 'https://someplace.com/video.mp',
              copyrightNotice: ''
            }
          ]
        },
        note: ''
      };
      result = sut.getCdnResources(content);
      expect(result).toHaveLength(0);
    });

    it('returns empty list for an internal resource without url', () => {
      content = {
        player1: {
          track: {
            sourceUrl: null,
            copyrightNotice: ''
          },
          posterImage: {
            sourceUrl: ''
          }
        },
        player2: {
          tracks: [
            {
              sourceUrl: '',
              copyrightNotice: ''
            },
            {
              sourceUrl: '',
              copyrightNotice: ''
            }
          ]
        },
        note: ''
      };
      result = sut.getCdnResources(content);
      expect(result).toHaveLength(0);
    });

    it('returns a list with the url for an internal public resource', () => {
      content = {
        player1: {
          track: {
            sourceUrl: 'cdn://media-library/some-video-1.mp4',
            copyrightNotice: ''
          },
          posterImage: {
            sourceUrl: 'cdn://media-library/some-image.jpg'
          }
        },
        player2: {
          tracks: [
            {
              sourceUrl: 'cdn://media-library/some-video-2.mp4',
              copyrightNotice: ''
            },
            {
              sourceUrl: 'cdn://media-library/some-video-3.mp4',
              copyrightNotice: ''
            }
          ]
        },
        note: ''
      };
      result = sut.getCdnResources(content);
      expect(result).toEqual([
        'cdn://media-library/some-video-1.mp4',
        'cdn://media-library/some-image.jpg',
        'cdn://media-library/some-video-2.mp4',
        'cdn://media-library/some-video-3.mp4'
      ]);
    });

    it('returns a list with the url for an internal room-media resource', () => {
      content = {
        player1: {
          track: {
            sourceUrl: 'cdn://room-media/12345/some-video-1.mp4',
            copyrightNotice: ''
          },
          posterImage: {
            sourceUrl: 'cdn://room-media/12345/some-image.jpg'
          }
        },
        player2: {
          tracks: [
            {
              sourceUrl: 'cdn://room-media/12345/some-video-2.mp4',
              copyrightNotice: ''
            },
            {
              sourceUrl: 'cdn://room-media/12345/some-video-3.mp4',
              copyrightNotice: ''
            }
          ]
        },
        note: ''
      };
      result = sut.getCdnResources(content);
      expect(result).toEqual([
        'cdn://room-media/12345/some-video-1.mp4',
        'cdn://room-media/12345/some-image.jpg',
        'cdn://room-media/12345/some-video-2.mp4',
        'cdn://room-media/12345/some-video-3.mp4'
      ]);
    });
  });
});
