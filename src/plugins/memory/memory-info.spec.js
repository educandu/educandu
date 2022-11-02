import MemoryInfo from './memory-info.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

describe('memory-info', () => {
  let sut;
  let result;
  let content;
  const roomId1 = '12345';
  const roomId2 = '67890';

  beforeEach(() => {
    sut = new MemoryInfo(new GithubFlavoredMarkdown());
  });

  describe('redactContent', () => {
    beforeEach(() => {
      content = {
        tilePairs: [
          [
            { text: `![link](cdn://rooms/${roomId1}/media/image-1.png)` },
            { text: '![link](cdn://media/63cHjt3BAhGnNxzJGrTsN1/image-2.png)' }
          ],
          [
            { text: '' },
            { text: '![link](http://somewhere.out.there/image-3.png)' }
          ]
        ]
      };
    });

    describe('when the target room is the same as the current room', () => {
      beforeEach(() => {
        result = sut.redactContent(content, roomId1);
      });

      it('leaves private resources from the same room intact', () => {
        expect(result.tilePairs[0][0].text).toEqual(`![link](cdn://rooms/${roomId1}/media/image-1.png)`);
      });
      it('leaves public resources intact', () => {
        expect(result.tilePairs[0][1].text).toEqual('![link](cdn://media/63cHjt3BAhGnNxzJGrTsN1/image-2.png)');
      });
      it('disregards empty text', () => {
        expect(result.tilePairs[1][0].text).toEqual('');
      });
      it('leaves external resources intact', () => {
        expect(result.tilePairs[1][1].text).toEqual('![link](http://somewhere.out.there/image-3.png)');
      });
    });

    describe('when the target room different than the current room', () => {
      beforeEach(() => {
        result = sut.redactContent(content, roomId2);
      });

      it('redacts private resources from the other room', () => {
        expect(result.tilePairs[0][0].text).toEqual('![link]()');
      });
      it('leaves public resources intact', () => {
        expect(result.tilePairs[0][1].text).toEqual('![link](cdn://media/63cHjt3BAhGnNxzJGrTsN1/image-2.png)');
      });
      it('disregards empty text', () => {
        expect(result.tilePairs[1][0].text).toEqual('');
      });
      it('leaves external resources intact', () => {
        expect(result.tilePairs[1][1].text).toEqual('![link](http://somewhere.out.there/image-3.png)');
      });
    });
  });

  describe('getCdnResources', () => {
    beforeEach(() => {
      content = {
        tilePairs: [
          [
            { text: `![link](cdn://rooms/${roomId1}/media/image-1.png)` },
            { text: '![link](cdn://media/63cHjt3BAhGnNxzJGrTsN1/image-2.png)' }
          ],
          [
            { text: '![link](cdn://media/63cHjt3BAhGnNxzJGrTsN1/image-2.png)' },
            { text: '![link](http://somewhere.out.there/image-3.png)' }
          ]
        ]
      };
      result = sut.getCdnResources(content);
    });
    it('returns public and private CDN resources from the text, without duplicates', () => {
      expect(result).toStrictEqual([
        `cdn://rooms/${roomId1}/media/image-1.png`,
        'cdn://media/63cHjt3BAhGnNxzJGrTsN1/image-2.png'
      ]);
    });
  });
});
