import { beforeEach, describe, expect, it } from 'vitest';
import MigrationScript from './educandu-2023-02-28-01-migrate-document-media-to-media-library.js';

describe('educandu-2023-02-28-01-migrate-document-media-to-media-library', () => {
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
            content: {
              copyrightNotice:
                  'Notice document portable: ![](cdn://document-media/123/logo.svg)'
                + 'Notice room portable: ![](cdn://room-media/123/logo.svg)'
                + 'Notice external URL: ![external](https://domain.de/logo.svg)'
                + 'Notice external CDN URL: ![external](https://cdn.domain.de/logo.svg)'
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
            content: {
              copyrightNotice:
                  'Notice document portable: ![](cdn://media-library/logo.svg)'
                + 'Notice room portable: ![](cdn://room-media/123/logo.svg)'
                + 'Notice external URL: ![external](https://domain.de/logo.svg)'
                + 'Notice external CDN URL: ![external](https://cdn.domain.de/logo.svg)'
                + 'Notice empty: ![]()'
            }
          }
        ]
      });
    });
  });
});
