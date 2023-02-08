import { beforeEach, describe, expect, it } from 'vitest';
import MigrationScript from './educandu-2023-02-08-02-change-accessible-cdn-urls-in-documents.js';

describe('educandu-2023-02-08-02-change-accessible-cdn-urls-in-documents', () => {
  let sut;

  beforeEach(() => {
    const fakeDb = {};
    sut = new MigrationScript(fakeDb);
  });

  describe('updateDoc', () => {
    it('redacts CDN URLs from a document', () => {
      const doc = {
        sections: [
          {
            type: 'abc-notation',
            content: null
          },
          {
            type: 'abc-notation',
            content: {
              copyrightNotice:
                  'Notice document accessible: ![](https://cdn.do.main/media/123/logo.svg)'
                + 'Notice document portable: ![](cdn://media/123/logo.svg)'
                + 'Notice room accessible: ![](https://cdn.do.main/rooms/123/media/logo.svg)'
                + 'Notice room portable: ![](cdn://rooms/123/media/logo.svg)'
                + 'Notice external URL: ![external](https://domain.de/)'
                + 'Notice empty: ![]()'
            }
          }
        ]
      };
      const result = sut.updateDoc(doc);
      expect(result.isUpdated).toBe(true);
      expect(result.doc).toStrictEqual({
        sections: [
          {
            type: 'abc-notation',
            content: null
          },
          {
            type: 'abc-notation',
            content: {
              copyrightNotice:
                  'Notice document accessible: ![](cdn://document-media/123/logo.svg)'
                + 'Notice document portable: ![](cdn://document-media/123/logo.svg)'
                + 'Notice room accessible: ![](cdn://room-media/123/logo.svg)'
                + 'Notice room portable: ![](cdn://room-media/123/logo.svg)'
                + 'Notice external URL: ![external](https://domain.de/)'
                + 'Notice empty: ![]()'
            }
          }
        ]
      });
    });
  });
});
