import { describe, expect, it } from 'vitest';
import { consolidateCdnResourcesForSaving } from './cdn-resource-utils.js';

describe('cdn-resource-utils', () => {

  describe('consolidateCdnResourcesForSaving', () => {

    it('should return all unique items sorted', () => {
      const result = consolidateCdnResourcesForSaving([
        'cdn://media-library/def.png',
        'cdn://media-library/abc.svg',
        'cdn://media-library/ghi.mp3'
      ]);
      expect(result).toStrictEqual([
        'cdn://media-library/abc.svg',
        'cdn://media-library/def.png',
        'cdn://media-library/ghi.mp3'
      ]);
    });

    it('should remove URL encoding', () => {
      const result = consolidateCdnResourcesForSaving([
        'cdn://media-library/%C3%9Cbung%201%20-%20Sopran%20+%20Bass.png',
        'cdn://media-library/%C3%9Cbung%202%20-%20Alt%20+%20Tenor.png'
      ]);
      expect(result).toStrictEqual([
        'cdn://media-library/Übung 1 - Sopran + Bass.png',
        'cdn://media-library/Übung 2 - Alt + Tenor.png'
      ]);
    });

    it('should preserve special characters that do not stem from URL encoding', () => {
      const result = consolidateCdnResourcesForSaving([
        'cdn://media-library/Übung 1 - Sopran + Bass.png',
        'cdn://media-library/Übung 2 - Alt + Tenor.png'
      ]);
      expect(result).toStrictEqual([
        'cdn://media-library/Übung 1 - Sopran + Bass.png',
        'cdn://media-library/Übung 2 - Alt + Tenor.png'
      ]);
    });

    it('should remove identical items from the result', () => {
      const result = consolidateCdnResourcesForSaving([
        'cdn://media-library/%C3%9Cbung%201%20-%20Sopran%20+%20Bass.png',
        'cdn://media-library/%C3%9Cbung%202%20-%20Alt%20+%20Tenor.png',
        'cdn://media-library/Übung 1 - Sopran + Bass.png',
        'cdn://media-library/Übung 2 - Alt + Tenor.png'
      ]);
      expect(result).toStrictEqual([
        'cdn://media-library/Übung 1 - Sopran + Bass.png',
        'cdn://media-library/Übung 2 - Alt + Tenor.png'
      ]);
    });

    it('should trim input and remove nullish and empty items from the result', () => {
      const result = consolidateCdnResourcesForSaving([
        'cdn://media-library/abc.svg',
        null,
        'cdn://media-library/def.png',
        '  ',
        '   cdn://media-library/ghi.mp3   '
      ]);
      expect(result).toStrictEqual([
        'cdn://media-library/abc.svg',
        'cdn://media-library/def.png',
        'cdn://media-library/ghi.mp3'
      ]);
    });

  });

});
