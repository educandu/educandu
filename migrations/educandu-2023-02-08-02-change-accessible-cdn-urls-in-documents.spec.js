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
            type: 'audio',
            content: {
              sourceUrl: 'https://cdn.elmu.online/media/123/song.mp3'
            }
          },
          {
            type: 'abc-notation',
            content: {
              copyrightNotice:
                  'Notice document accessible Int: ![](https://cdn.integration.openmusic.academy/media/123/logo.svg)'
                + 'Notice document accessible Stag: ![](https://cdn.staging.openmusic.academy/media/123/logo.svg)'
                + 'Notice document accessible Prod: ![](https://cdn.openmusic.academy/media/123/logo.svg)'
                + 'Notice document accessible Elmu: ![](https://cdn.elmu.online/media/123/logo.svg)'
                + 'Notice document portable : ![](cdn://media/123/logo.svg)'
                + 'Notice room accessible Int: ![](https://cdn.integration.openmusic.academy/rooms/123/media/logo.svg)'
                + 'Notice room accessible Stag: ![](https://cdn.staging.openmusic.academy/rooms/123/media/logo.svg)'
                + 'Notice room accessible Prod: ![](https://cdn.openmusic.academy/rooms/123/media/logo.svg)'
                + 'Notice room portable: ![](cdn://rooms/123/media/logo.svg)'
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
            type: 'audio',
            content: {
              sourceUrl: 'cdn://document-media/123/song.mp3'
            }
          },
          {
            type: 'abc-notation',
            content: {
              copyrightNotice:
                  'Notice document accessible Int: ![](cdn://document-media/123/logo.svg)'
                + 'Notice document accessible Stag: ![](cdn://document-media/123/logo.svg)'
                + 'Notice document accessible Prod: ![](cdn://document-media/123/logo.svg)'
                + 'Notice document accessible Elmu: ![](cdn://document-media/123/logo.svg)'
                + 'Notice document portable : ![](cdn://document-media/123/logo.svg)'
                + 'Notice room accessible Int: ![](cdn://room-media/123/logo.svg)'
                + 'Notice room accessible Stag: ![](cdn://room-media/123/logo.svg)'
                + 'Notice room accessible Prod: ![](cdn://room-media/123/logo.svg)'
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
