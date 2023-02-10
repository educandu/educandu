import { beforeEach, describe, expect, it } from 'vitest';
import MigrationScript from './educandu-2023-02-10-01-change-accessible-cdn-urls-catalog-external-link-types.js';

describe('educandu-2023-02-10-01-change-accessible-cdn-urls-catalog-external-link-types', () => {
  let sut;

  beforeEach(() => {
    const fakeDb = {};
    sut = new MigrationScript(fakeDb);
  });

  describe('updateDoc', () => {
    it('redacts CDN URLs from catalog plugins', () => {
      const doc = {
        sections: [
          {
            type: 'audio',
            content: {
              sourceUrl: 'https://cdn.elmu.online/media/123/song.mp3'
            }
          },
          {
            type: 'catalog',
            content: {
              link: {
                sourceType: 'document',
                sourceUrl: 'https://cdn.integration.openmusic.academy/media/123/logo.pdf'
              }
            }
          },
          {
            type: 'catalog',
            content: {
              link: {
                sourceType: 'external',
                sourceUrl: 'https://cdn.integration.openmusic.academy/media/123/logo.pdf'
              }
            }
          },
          {
            type: 'catalog',
            content: {
              link: {
                sourceType: 'external',
                sourceUrl: 'cdn://rooms/123/media/logo.pdf'
              }
            }
          }
        ]
      };
      const result = sut.updateDoc(doc);
      expect(result.isUpdated).toBe(true);
      expect(result.doc).toStrictEqual({
        sections: [
          {
            type: 'audio',
            content: {
              sourceUrl: 'cdn://document-media/123/song.mp3'
            }
          },
          {
            type: 'catalog',
            content: {
              link: {
                sourceType: 'document',
                sourceUrl: 'cdn://document-media/123/logo.pdf'
              }
            }
          },
          {
            type: 'catalog',
            content: {
              link: {
                sourceType: 'external',
                sourceUrl: 'cdn://document-media/123/logo.pdf'
              }
            }
          },
          {
            type: 'catalog',
            content: {
              link: {
                sourceType: 'external',
                sourceUrl: 'cdn://room-media/123/logo.pdf'
              }
            }
          }
        ]
      });
    });
  });
});
