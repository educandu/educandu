import ServerTimeInfo from './server-time-info.js';
import { beforeEach, describe, expect, it } from 'vitest';
import GithubFlavoredMarkdown from '../../../src/common/github-flavored-markdown.js';

describe('server-time-info', () => {
  let sut;

  beforeEach(() => {
    sut = new ServerTimeInfo(new GithubFlavoredMarkdown());
  });

  describe('redactContent', () => {
    it('redacts room-media resources from different rooms', () => {
      const result = sut.redactContent({
        text: '![Some image](cdn://room-media/63cHjt3BAhGnNxzJGrTsN1/some-image.png)'
      }, 'rebhjf4MLq7yjeoCnYfn7E');
      expect(result).toStrictEqual({
        text: '![Some image]()'
      });
    });

    it('leaves room-media resources from the same room intact', () => {
      const result = sut.redactContent({
        text: '![Some image](cdn://room-media/63cHjt3BAhGnNxzJGrTsN1/some-image.png)'
      }, '63cHjt3BAhGnNxzJGrTsN1');
      expect(result).toStrictEqual({
        text: '![Some image](cdn://room-media/63cHjt3BAhGnNxzJGrTsN1/some-image.png)'
      });
    });

    it('leaves non room-media resources intact', () => {
      const result = sut.redactContent({
        text: '![Some image](cdn://document-media/JgTaqob5vqosBiHsZZoh1/some-image.png)'
      }, 'rebhjf4MLq7yjeoCnYfn7E');
      expect(result).toStrictEqual({
        text: '![Some image](cdn://document-media/JgTaqob5vqosBiHsZZoh1/some-image.png)'
      });
    });
  });

  describe('getCdnResources', () => {
    it('returns document-media and room-media CDN resources from the text', () => {
      const result = sut.getCdnResources({
        text: [
          '![Some image](cdn://document-media/JgTaqob5vqosBiHsZZoh1/some-image.png)',
          '![Some image](cdn://room-media/63cHjt3BAhGnNxzJGrTsN1/some-image.png)',
          '![Some image](https://external-domain.org/some-image.png)'
        ].join('\n')
      });
      expect(result).toStrictEqual([
        'cdn://document-media/JgTaqob5vqosBiHsZZoh1/some-image.png',
        'cdn://room-media/63cHjt3BAhGnNxzJGrTsN1/some-image.png'
      ]);
    });
  });
});
