import { csvToObjects, objectsToCsv } from './csv-utils.js';

describe('csv-utils', () => {

  describe('objectsToCsv', () => {

    it('stringifies the objects correctly', () => {
      const objects = [
        {
          numberValue: 0,
          stringValue: 'Some text\n\nwith line breaks'
        },
        {
          numberValue: 0.3,
          stringValue: 'Some text with "QUOTES" inside'
        },
        {
          numberValue: 0.6,
          stringValue: 'Some other text'
        }
      ];

      const csv = objectsToCsv(objects, ['numberValue', 'stringValue']);

      expect(csv).toBe([
        '"numberValue","stringValue"',
        '0,"Some text\n\nwith line breaks"',
        '0.3,"Some text with ""QUOTES"" inside"',
        '0.6,"Some other text"',
        ''
      ].join('\n'));
    });

  });

  describe('csvToObjects', () => {

    it('parses the objects correctly', async () => {
      const csv = [
        '"numberValue","stringValue"',
        '0,"Some text\n\nwith line breaks"',
        '0.3,"Text 1 - Segment 2\n\nText 2 - Segment 2"',
        '0.6,"Text 1 - Segment 3\n\nText 2 - Segment 3"',
        ''
      ].join('\n');

      const objects = await csvToObjects(csv);

      expect(objects).toEqual([
        {
          numberValue: '0',
          stringValue: 'Some text\n\nwith line breaks'
        },
        {
          numberValue: '0.3',
          stringValue: 'Text 1 - Segment 2\n\nText 2 - Segment 2'
        },
        {
          numberValue: '0.6',
          stringValue: 'Text 1 - Segment 3\n\nText 2 - Segment 3'
        }
      ]);
    });

  });

});
