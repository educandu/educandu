import MarkdownInfo from './markdown-info.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

describe('markdown-info', () => {
  let sut;

  beforeEach(() => {
    sut = new MarkdownInfo(new GithubFlavoredMarkdown());
  });

  describe('redactContent', () => {
    it('redacts private resources from different rooms', () => {
      const result = sut.redactContent({
        text: '![Some image](cdn://rooms/63cHjt3BAhGnNxzJGrTsN1/media/some-image.png)'
      }, 'rebhjf4MLq7yjeoCnYfn7E');
      expect(result).toStrictEqual({
        text: '![Some image]()'
      });
    });

    it('leaves private resources from the same room intact', () => {
      const result = sut.redactContent({
        text: '![Some image](cdn://rooms/63cHjt3BAhGnNxzJGrTsN1/media/some-image.png)'
      }, '63cHjt3BAhGnNxzJGrTsN1');
      expect(result).toStrictEqual({
        text: '![Some image](cdn://rooms/63cHjt3BAhGnNxzJGrTsN1/media/some-image.png)'
      });
    });

    it('leaves public resources intact', () => {
      const result = sut.redactContent({
        text: '![Some image](cdn://media/JgTaqob5vqosBiHsZZoh1/some-image.png)'
      }, 'rebhjf4MLq7yjeoCnYfn7E');
      expect(result).toStrictEqual({
        text: '![Some image](cdn://media/JgTaqob5vqosBiHsZZoh1/some-image.png)'
      });
    });
  });

  describe('getCdnResources', () => {
    it('returns public and private CDN resources from the text', () => {
      const result = sut.getCdnResources({
        text: [
          '![Some image](cdn://media/JgTaqob5vqosBiHsZZoh1/some-image.png)',
          '![Some image](cdn://rooms/63cHjt3BAhGnNxzJGrTsN1/media/some-image.png)',
          '![Some image](https://external-domain.org/some-image.png)'
        ].join('\n')
      });
      expect(result).toStrictEqual([
        'cdn://media/JgTaqob5vqosBiHsZZoh1/some-image.png',
        'cdn://rooms/63cHjt3BAhGnNxzJGrTsN1/media/some-image.png'
      ]);
    });
  });
});
