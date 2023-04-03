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
          'Logo document accessible Int: ![](https://cdn.integration.openmusic.academy/media/123/logo.svg)'
        + 'Logo document accessible Stag: ![](https://cdn.staging.openmusic.academy/media/123/logo.svg)'
        + 'Logo document accessible Prod: ![](https://cdn.openmusic.academy/media/123/logo.svg)'
        + 'Logo document accessible Elmu: ![](https://cdn.elmu.online/media/123/logo.svg)'
        + 'Logo document portable : ![](cdn://media/123/logo.svg)'
        + 'Logo room accessible Int: ![](https://cdn.integration.openmusic.academy/rooms/123/media/logo.svg)'
        + 'Logo room accessible Stag: ![](https://cdn.staging.openmusic.academy/rooms/123/media/logo.svg)'
        + 'Logo room accessible Prod: ![](https://cdn.openmusic.academy/rooms/123/media/logo.svg)'
        + 'Logo room portable: ![](cdn://rooms/123/media/logo.svg)'
        + 'Logo external URL: ![external](https://domain.de/logo.svg)'
        + 'Logo external CDN URL: ![external](https://cdn.domain.de/logo.svg)'
        + 'Logo empty: ![]()'
      };
      const result = await sut.redactRoomDescription(room);
      expect(result).toBe(true);
      expect(room).toStrictEqual({
        description:
          'Logo document accessible Int: ![](cdn://document-media/123/logo.svg)'
        + 'Logo document accessible Stag: ![](cdn://document-media/123/logo.svg)'
        + 'Logo document accessible Prod: ![](cdn://document-media/123/logo.svg)'
        + 'Logo document accessible Elmu: ![](cdn://document-media/123/logo.svg)'
        + 'Logo document portable : ![](cdn://document-media/123/logo.svg)'
        + 'Logo room accessible Int: ![](cdn://room-media/123/logo.svg)'
        + 'Logo room accessible Stag: ![](cdn://room-media/123/logo.svg)'
        + 'Logo room accessible Prod: ![](cdn://room-media/123/logo.svg)'
        + 'Logo room portable: ![](cdn://room-media/123/logo.svg)'
        + 'Logo external URL: ![external](https://domain.de/logo.svg)'
        + 'Logo external CDN URL: ![external](https://cdn.domain.de/logo.svg)'
        + 'Logo empty: ![]()'
      });
    });
  });
});
