import { exportChaptersToCsv, importChaptersFromCsv } from './media-analysis-utils.js';

describe('media-analysis-utils', () => {

  describe('exportChaptersToCsv', () => {

    it('exports the chapters correctly', () => {
      const chapters = [
        {
          key: '2t4n8naztza4tlc',
          startPosition: 0,
          color: '#4582b4',
          title: 'Intro',
          text: 'Annotation 1 - Segment 1\n\nAnnotation 2 - Segment 1'
        },
        {
          key: 'sadflicqigsaeac',
          startPosition: 0.3,
          color: '#228b22',
          title: 'Chorus',
          text: 'Annotation with "QUOTES" inside'
        },
        {
          key: '3p9z4qpgqorzesy',
          startPosition: 0.6,
          color: '#000000',
          title: 'Outro',
          text: 'Another annotation'
        }
      ];

      const csv = exportChaptersToCsv(chapters);

      expect(csv).toBe([
        '"startPosition","title","color","text"',
        '0,"Intro","#4582b4","Annotation 1 - Segment 1\n\nAnnotation 2 - Segment 1"',
        '0.3,"Chorus","#228b22","Annotation with ""QUOTES"" inside"',
        '0.6,"Outro","#000000","Another annotation"',
        ''
      ].join('\n'));
    });

  });

  describe('importChaptersFromCsv', () => {

    it('parses the chapters correctly', async () => {
      const csv = [
        '"startPosition","title","color","text"',
        '0,Intro,#4582b4,"Annotation 1 - Segment 1\n\nAnnotation 2 - Segment 1"',
        '0.3,Chorus,#228b22,"Annotation 1 - Segment 2\n\nAnnotation 2 - Segment 2"',
        '0.6,Outro,#000000,"Annotation 1 - Segment 3\n\nAnnotation 2 - Segment 3"',
        ''
      ].join('\n');

      const chapters = await importChaptersFromCsv(csv);

      expect(chapters).toEqual([
        {
          key: expect.any(String),
          startPosition: 0,
          color: '#4582b4',
          title: 'Intro',
          text: 'Annotation 1 - Segment 1\n\nAnnotation 2 - Segment 1'
        },
        {
          key: expect.any(String),
          startPosition: 0.3,
          color: '#228b22',
          title: 'Chorus',
          text: 'Annotation 1 - Segment 2\n\nAnnotation 2 - Segment 2'
        },
        {
          key: expect.any(String),
          startPosition: 0.6,
          color: '#000000',
          title: 'Outro',
          text: 'Annotation 1 - Segment 3\n\nAnnotation 2 - Segment 3'
        }
      ]);
    });

    it('throws if the CSV does not contain any chapters', async () => {
      const csv = [
        '"startPosition","title","color","text"',
        ''
      ].join('\n');

      await expect(() => importChaptersFromCsv(csv)).rejects.toThrow('There has to be at least one chapter');
    });

    it('throws if chapters do not start at position 0', async () => {
      const csv = [
        '"startPosition","title","color","text"',
        '0.1,Intro,#4582b4,"Annotation"',
        ''
      ].join('\n');

      await expect(() => importChaptersFromCsv(csv)).rejects.toThrow('First chapter has to start at position 0');
    });

    it('throws if start positions are not unique', async () => {
      const csv = [
        '"startPosition","title","color","text"',
        '0,Intro,#4582b4,"Annotation"',
        '0.3,Chorus,#228b22,"Annotation"',
        '0.3,Outro,#000000,"Annotation"',
        ''
      ].join('\n');

      await expect(() => importChaptersFromCsv(csv)).rejects.toThrow('Invalid start position');
    });

    it('throws if start positions are out of order', async () => {
      const csv = [
        '"startPosition","title","color","text"',
        '0,Intro,#4582b4,"Annotation"',
        '0.6,Chorus,#228b22,"Annotation"',
        '0.3,Outro,#000000,"Annotation"',
        ''
      ].join('\n');

      await expect(() => importChaptersFromCsv(csv)).rejects.toThrow('Invalid start position');
    });

    it('throws if the chapter validation fails', async () => {
      const csv = [
        '"startPosition","title","color","text"',
        '0,Intro,#4582b4,"Annotation"',
        '0.3,Chorus,#228b22,"Annotation"',
        '0.6,Outro,#invalid_color,"Annotation"',
        ''
      ].join('\n');

      await expect(() => importChaptersFromCsv(csv)).rejects.toThrow('#invalid_color');
    });

  });

});
