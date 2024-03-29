import MatchingCardsInfo from './matching-cards-info.js';
import { beforeEach, describe, expect, it } from 'vitest';
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
              text: `![link](cdn://room-media/${roomId1}/image-1a.png)`,
              sourceUrl: `cdn://room-media/${roomId1}/image-1b.png`
            },
            {
              text: '![link](cdn://media-library/image-2a.png)',
              sourceUrl: 'cdn://media-library/image-2b.png'
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

      it('leaves room-media resources from the same room intact', () => {
        expect(result.tilePairs[0][0].text).toEqual(`![link](cdn://room-media/${roomId1}/image-1a.png)`);
        expect(result.tilePairs[0][0].sourceUrl).toEqual(`cdn://room-media/${roomId1}/image-1b.png`);
      });
      it('leaves non room-media resources intact', () => {
        expect(result.tilePairs[0][1].text).toEqual('![link](cdn://media-library/image-2a.png)');
        expect(result.tilePairs[0][1].sourceUrl).toEqual('cdn://media-library/image-2b.png');
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

      it('redacts room-media resources from the other room', () => {
        expect(result.tilePairs[0][0].text).toEqual('![link]()');
        expect(result.tilePairs[0][0].sourceUrl).toEqual('');
      });
      it('leaves non room-media resources intact', () => {
        expect(result.tilePairs[0][1].text).toEqual('![link](cdn://media-library/image-2a.png)');
        expect(result.tilePairs[0][1].sourceUrl).toEqual('cdn://media-library/image-2b.png');
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
              text: `![link](cdn://room-media/${roomId1}/image-1a.png)`,
              sourceUrl: `cdn://room-media/${roomId1}/image-1b.png`
            },
            {
              text: '![link](cdn://media-library/image-2a.png)',
              sourceUrl: 'cdn://media-library/image-2b.png'
            }
          ],
          [
            {
              text: '![link](cdn://media-library/image-2a.png)',
              sourceUrl: 'cdn://media-library/image-2b.png'
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
    it('returns media-library and room-media CDN resources from the text, without duplicates', () => {
      expect(result).toStrictEqual([
        `cdn://room-media/${roomId1}/image-1a.png`,
        'cdn://media-library/image-2a.png',
        `cdn://room-media/${roomId1}/image-1b.png`,
        'cdn://media-library/image-2b.png'
      ]);
    });
  });
});
