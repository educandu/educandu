import { beforeEach, describe, expect, it } from 'vitest';
import MigrationScript from './educandu-2023-02-08-01-change-cdn-urls-in-rooms.js';

describe('educandu-2023-02-08-01-change-cdn-urls-in-rooms', () => {
  let sut;

  beforeEach(() => {
    const fakeDb = {};
    sut = new MigrationScript(fakeDb);
  });

  describe('redactRoomDescription', () => {
    it('redacts all CDN URLs', async () => {
      const room = {
        description:
          'Logo document accessible: ![](https://cdn.do.main/media/123/logo.svg)'
        + 'Logo document portable: ![](cdn://media/123/logo.svg)'
        + 'Logo room accessible: ![](https://cdn.do.main/rooms/123/media/logo.svg)'
        + 'Logo room portable: ![](cdn://rooms/123/media/logo.svg)'
        + 'External URL: ![external](https://domain.de/)'
        + 'Empty: ![]()'
      };
      const result = await sut.redactRoomDescription(room);
      expect(result).toBe(true);
      expect(room).toStrictEqual({
        description:
          'Logo document accessible: ![](cdn://document-media/123/logo.svg)'
        + 'Logo document portable: ![](cdn://document-media/123/logo.svg)'
        + 'Logo room accessible: ![](cdn://room-media/123/logo.svg)'
        + 'Logo room portable: ![](cdn://room-media/123/logo.svg)'
        + 'External URL: ![external](https://domain.de/)'
        + 'Empty: ![]()'
      });
    });
  });
});
