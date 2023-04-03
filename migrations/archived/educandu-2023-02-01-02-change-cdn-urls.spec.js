import { beforeEach, describe, expect, it } from 'vitest';
import MigrationScript from './educandu-2023-02-01-02-change-cdn-urls.js';

describe('educandu-2023-02-01-02-change-cdn-urls', () => {
  let sut;

  beforeEach(() => {
    const fakeDb = {};
    sut = new MigrationScript(fakeDb);
  });

  describe('updateDoc', () => {
    it('redacts CDN URLs from a document', () => {
      const doc = {
        cdnResources: [
          'cdn://rooms/roomId1/media/resource',
          'cdn://media/document1/resource2'
        ],
        sections: [
          {
            type: 'image',
            content: null
          },
          {
            type: 'image',
            content: {
              sourceUrl: 'cdn://rooms/roomId1/media/resource1',
              copyrightNotice: 'Notice for ![](cdn://rooms/roomId1/media/resource1)',
              hoverEffect: {
                sourceUrl: 'cdn://media/document1/resource2',
                copyrightNotice: 'Notice for ![](cdn://media/document1/resource2)'
              },
              revealEffect: {
                sourceUrl: 'https://external-resources.com/resource3',
                copyrightNotice: 'Notice for ![](https://external-resources.com/resource3)'
              }
            }
          }
        ]
      };
      const result = sut.updateDoc(doc);
      expect(result).toStrictEqual({
        cdnResources: [
          'cdn://room-media/roomId1/resource',
          'cdn://document-media/document1/resource2'
        ],
        sections: [
          {
            type: 'image',
            content: null
          },
          {
            type: 'image',
            content: {
              sourceUrl: 'cdn://room-media/roomId1/resource1',
              copyrightNotice: 'Notice for ![](cdn://room-media/roomId1/resource1)',
              hoverEffect: {
                sourceUrl: 'cdn://document-media/document1/resource2',
                copyrightNotice: 'Notice for ![](cdn://document-media/document1/resource2)'
              },
              revealEffect: {
                sourceUrl: 'https://external-resources.com/resource3',
                copyrightNotice: 'Notice for ![](https://external-resources.com/resource3)'
              }
            }
          }
        ]
      });
    });
  });
});
