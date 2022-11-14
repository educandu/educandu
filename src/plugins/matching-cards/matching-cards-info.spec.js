import MatchingCardsInfo from './matching-cards-info.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

describe('matching-cards-info', () => {
  let sut;
  let result;
  let content;
  const roomId1 = '12345';
  const roomId2 = '67890';

  beforeEach(() => {
    sut = new MatchingCardsInfo(new GithubFlavoredMarkdown());
  });

  describe('redactContent', () => {
    beforeEach(() => {
      content = {
        tilePairs: [
          [
            {
              text: `![link](cdn://rooms/${roomId1}/media/image-1a.png)`,
              sourceUrl: `cdn://rooms/${roomId1}/media/image-1b.png`
            },
            {
              text: '![link](cdn://media/63cHjt3BAhGnNxzJGrTsN1/image-2a.png)',
              sourceUrl: 'cdn://media/63cHjt3BAhGnNxzJGrTsN1/image-2b.png'
            }
          ],
          [
            {
              text: '',
              sourceUrl: ''
            },
            {
              text: '![link](http://somewhere.out.there/image-3a.png)',
              sourceUrl: 'http://somewhere.out.there/image-3b.png'
            }
          ]
        ]
      };
    });

    describe('when the target room is the same as the current room', () => {
      beforeEach(() => {
        result = sut.redactContent(content, roomId1);
      });

      it('leaves private resources from the same room intact', () => {
        expect(result.tilePairs[0][0].text).toEqual(`![link](cdn://rooms/${roomId1}/media/image-1a.png)`);
        expect(result.tilePairs[0][0].sourceUrl).toEqual(`cdn://rooms/${roomId1}/media/image-1b.png`);
      });
      it('leaves public resources intact', () => {
        expect(result.tilePairs[0][1].text).toEqual('![link](cdn://media/63cHjt3BAhGnNxzJGrTsN1/image-2a.png)');
        expect(result.tilePairs[0][1].sourceUrl).toEqual('cdn://media/63cHjt3BAhGnNxzJGrTsN1/image-2b.png');
      });
      it('disregards empty text', () => {
        expect(result.tilePairs[1][0].text).toEqual('');
        expect(result.tilePairs[1][0].sourceUrl).toEqual('');
      });
      it('leaves external resources intact', () => {
        expect(result.tilePairs[1][1].text).toEqual('![link](http://somewhere.out.there/image-3a.png)');
        expect(result.tilePairs[1][1].sourceUrl).toEqual('http://somewhere.out.there/image-3b.png');
      });
    });

    describe('when the target room different than the current room', () => {
      beforeEach(() => {
        result = sut.redactContent(content, roomId2);
      });

      it('redacts private resources from the other room', () => {
        expect(result.tilePairs[0][0].text).toEqual('![link]()');
        expect(result.tilePairs[0][0].sourceUrl).toEqual('');
      });
      it('leaves public resources intact', () => {
        expect(result.tilePairs[0][1].text).toEqual('![link](cdn://media/63cHjt3BAhGnNxzJGrTsN1/image-2a.png)');
        expect(result.tilePairs[0][1].sourceUrl).toEqual('cdn://media/63cHjt3BAhGnNxzJGrTsN1/image-2b.png');
      });
      it('disregards empty text', () => {
        expect(result.tilePairs[1][0].text).toEqual('');
        expect(result.tilePairs[1][0].sourceUrl).toEqual('');
      });
      it('leaves external resources intact', () => {
        expect(result.tilePairs[1][1].text).toEqual('![link](http://somewhere.out.there/image-3a.png)');
        expect(result.tilePairs[1][1].sourceUrl).toEqual('http://somewhere.out.there/image-3b.png');
      });
    });
  });

  describe('getCdnResources', () => {
    beforeEach(() => {
      content = {
        tilePairs: [
          [
            {
              text: `![link](cdn://rooms/${roomId1}/media/image-1a.png)`,
              sourceUrl: `cdn://rooms/${roomId1}/media/image-1b.png`
            },
            {
              text: '![link](cdn://media/63cHjt3BAhGnNxzJGrTsN1/image-2a.png)',
              sourceUrl: 'cdn://media/63cHjt3BAhGnNxzJGrTsN1/image-2b.png'
            }
          ],
          [
            {
              text: '![link](cdn://media/63cHjt3BAhGnNxzJGrTsN1/image-2a.png)',
              sourceUrl: 'cdn://media/63cHjt3BAhGnNxzJGrTsN1/image-2b.png'
            },
            {
              text: '![link](http://somewhere.out.there/image-3a.png)',
              sourceUrl: 'http://somewhere.out.there/image-3b.png'
            }
          ]
        ]
      };
      result = sut.getCdnResources(content);
    });
    it('returns public and private CDN resources from the text, without duplicates', () => {
      expect(result).toStrictEqual([
        `cdn://rooms/${roomId1}/media/image-1a.png`,
        'cdn://media/63cHjt3BAhGnNxzJGrTsN1/image-2a.png',
        `cdn://rooms/${roomId1}/media/image-1b.png`,
        'cdn://media/63cHjt3BAhGnNxzJGrTsN1/image-2b.png'
      ]);
    });
  });
});
