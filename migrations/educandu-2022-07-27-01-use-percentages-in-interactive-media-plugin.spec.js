import MigrationScript from './educandu-2022-07-27-01-use-percentages-in-interactive-media-plugin.js';

describe('educandu-2022-07-27-01-use-percentages-in-interactive-media-plugin', () => {
  let sut;

  beforeEach(() => {
    const fakeDb = {};
    sut = new MigrationScript(fakeDb);
  });

  describe('processSectionContent', () => {
    it('converts media without range restrictions correctly', () => {
      const input = {
        sourceType: 'youtube',
        sourceUrl: 'https://www.youtube.com/watch?v=3rcnz782o',
        copyrightNotice: '',
        sourceDuration: 60000,
        startTimecode: null,
        stopTimecode: null,
        sourceStartTimecode: null,
        sourceStopTimecode: null,
        width: 100,
        aspectRatio: '16:9',
        showVideo: true,
        chapters: [
          {
            key: 'em4G16dP8Vi69ER69LgGMv',
            startTimecode: 0,
            title: 'Title 1',
            answers: [],
            correctAnswerIndex: -1,
            text: 'Text 1'
          },
          {
            key: 'tvyYPYuLt1jr4PgUnxt7JW',
            startTimecode: 30000,
            title: 'Title 2',
            answers: [],
            correctAnswerIndex: -1,
            text: 'Text 2'
          }
        ]
      };

      const expectedResult = {
        sourceType: 'youtube',
        sourceUrl: 'https://www.youtube.com/watch?v=3rcnz782o',
        copyrightNotice: '',
        playbackRange: [0, 1],
        width: 100,
        aspectRatio: '16:9',
        showVideo: true,
        chapters: [
          {
            key: 'em4G16dP8Vi69ER69LgGMv',
            startPosition: 0,
            title: 'Title 1',
            answers: [],
            correctAnswerIndex: -1,
            text: 'Text 1'
          },
          {
            key: 'tvyYPYuLt1jr4PgUnxt7JW',
            startPosition: 0.5,
            title: 'Title 2',
            answers: [],
            correctAnswerIndex: -1,
            text: 'Text 2'
          }
        ]
      };

      const modifiedInput = JSON.parse(JSON.stringify(input));

      sut.processSectionContent(modifiedInput);

      expect(modifiedInput).toStrictEqual(expectedResult);
    });

    it('converts media with range restrictions correctly', () => {
      const input = {
        sourceType: 'youtube',
        sourceUrl: 'https://www.youtube.com/watch?v=3rcnz782o',
        copyrightNotice: '',
        sourceDuration: 100000,
        startTimecode: null,
        stopTimecode: null,
        sourceStartTimecode: 20000,
        sourceStopTimecode: 80000,
        width: 100,
        aspectRatio: '16:9',
        showVideo: true,
        chapters: [
          {
            key: 'em4G16dP8Vi69ER69LgGMv',
            startTimecode: 0,
            title: 'Title 1',
            answers: [],
            correctAnswerIndex: -1,
            text: 'Text 1'
          },
          {
            key: 'tvyYPYuLt1jr4PgUnxt7JW',
            startTimecode: 30000,
            title: 'Title 2',
            answers: [],
            correctAnswerIndex: -1,
            text: 'Text 2'
          }
        ]
      };

      const expectedResult = {
        sourceType: 'youtube',
        sourceUrl: 'https://www.youtube.com/watch?v=3rcnz782o',
        copyrightNotice: '',
        playbackRange: [0.2, 0.8],
        width: 100,
        aspectRatio: '16:9',
        showVideo: true,
        chapters: [
          {
            key: 'em4G16dP8Vi69ER69LgGMv',
            startPosition: 0,
            title: 'Title 1',
            answers: [],
            correctAnswerIndex: -1,
            text: 'Text 1'
          },
          {
            key: 'tvyYPYuLt1jr4PgUnxt7JW',
            startPosition: 0.5,
            title: 'Title 2',
            answers: [],
            correctAnswerIndex: -1,
            text: 'Text 2'
          }
        ]
      };

      const modifiedInput = JSON.parse(JSON.stringify(input));

      sut.processSectionContent(modifiedInput);

      expect(modifiedInput).toStrictEqual(expectedResult);
    });
  });

});
