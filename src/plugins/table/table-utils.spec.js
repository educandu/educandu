import { asciiTableToTableValues } from './table-utils.spec.helper.js';
import { insertRowBefore, insertRowAfter, deleteRow, insertColumnBefore, insertColumnAfter, deleteColumn } from './table-utils.js';

describe('table-utils', () => {

  describe('insertRowBefore', () => {
    const testCases = [
      {
        description: 'when inserted before the first row',
        expectation: 'it should insert the new row and shift the remaining rows down by one',
        rowIndex: 0,
        input: `
          ┌─────┬─────┬─────┐
          │ 0-0 │ 0-1 │ 0-2 │
          ├─────┼─────┼─────┤
          │ 1-0 │ 1-1 │ 1-2 │
          ├─────┼─────┼─────┤
          │ 2-0 │ 2-1 │ 2-2 │
          └─────┴─────┴─────┘
        `,
        expectedOutput: `
          ┌─────┬─────┬─────┐
          │ *   │ *   │ *   │
          ├─────┼─────┼─────┤
          │ 0-0 │ 0-1 │ 0-2 │
          ├─────┼─────┼─────┤
          │ 1-0 │ 1-1 │ 1-2 │
          ├─────┼─────┼─────┤
          │ 2-0 │ 2-1 │ 2-2 │
          └─────┴─────┴─────┘
        `
      },
      {
        description: 'when inserted before the last row',
        expectation: 'it should insert the new row and shift the last row down by one',
        rowIndex: 2,
        input: `
          ┌─────┬─────┬─────┐
          │ 0-0 │ 0-1 │ 0-2 │
          ├─────┼─────┼─────┤
          │ 1-0 │ 1-1 │ 1-2 │
          ├─────┼─────┼─────┤
          │ 2-0 │ 2-1 │ 2-2 │
          └─────┴─────┴─────┘
        `,
        expectedOutput: `
          ┌─────┬─────┬─────┐
          │ 0-0 │ 0-1 │ 0-2 │
          ├─────┼─────┼─────┤
          │ 1-0 │ 1-1 │ 1-2 │
          ├─────┼─────┼─────┤
          │ *   │ *   │ *   │
          ├─────┼─────┼─────┤
          │ 2-0 │ 2-1 │ 2-2 │
          └─────┴─────┴─────┘
        `
      },
      {
        description: 'when inserted before a row in the middle',
        expectation: 'it should insert the new row and shift the remaining rows down by one',
        rowIndex: 1,
        input: `
          ┌─────┬─────┬─────┐
          │ 0-0 │ 0-1 │ 0-2 │
          ├─────┼─────┼─────┤
          │ 1-0 │ 1-1 │ 1-2 │
          ├─────┼─────┼─────┤
          │ 2-0 │ 2-1 │ 2-2 │
          └─────┴─────┴─────┘
        `,
        expectedOutput: `
          ┌─────┬─────┬─────┐
          │ 0-0 │ 0-1 │ 0-2 │
          ├─────┼─────┼─────┤
          │ *   │ *   │ *   │
          ├─────┼─────┼─────┤
          │ 1-0 │ 1-1 │ 1-2 │
          ├─────┼─────┼─────┤
          │ 2-0 │ 2-1 │ 2-2 │
          └─────┴─────┴─────┘
        `
      }
    ];

    testCases.forEach(({ description, expectation, rowIndex, input, expectedOutput }) => {
      describe(description, () => {
        let result;
        beforeEach(() => {
          result = insertRowBefore(asciiTableToTableValues(input), rowIndex);
        });
        it(expectation, () => {
          expect(result).toStrictEqual(asciiTableToTableValues(expectedOutput));
        });
      });
    });
  });

  describe('insertRowAfter', () => {
    const testCases = [
      {
        description: 'when inserted after the first row',
        expectation: 'it should insert the new row and shift the remaining rows down by one',
        rowIndex: 0,
        input: `
          ┌─────┬─────┬─────┐
          │ 0-0 │ 0-1 │ 0-2 │
          ├─────┼─────┼─────┤
          │ 1-0 │ 1-1 │ 1-2 │
          ├─────┼─────┼─────┤
          │ 2-0 │ 2-1 │ 2-2 │
          └─────┴─────┴─────┘
        `,
        expectedOutput: `
          ┌─────┬─────┬─────┐
          │ 0-0 │ 0-1 │ 0-2 │
          ├─────┼─────┼─────┤
          │ *   │ *   │ *   │
          ├─────┼─────┼─────┤
          │ 1-0 │ 1-1 │ 1-2 │
          ├─────┼─────┼─────┤
          │ 2-0 │ 2-1 │ 2-2 │
          └─────┴─────┴─────┘
        `
      },
      {
        description: 'when inserted after the last row',
        expectation: 'it should insert the new row at the end',
        rowIndex: 2,
        input: `
          ┌─────┬─────┬─────┐
          │ 0-0 │ 0-1 │ 0-2 │
          ├─────┼─────┼─────┤
          │ 1-0 │ 1-1 │ 1-2 │
          ├─────┼─────┼─────┤
          │ 2-0 │ 2-1 │ 2-2 │
          └─────┴─────┴─────┘
        `,
        expectedOutput: `
          ┌─────┬─────┬─────┐
          │ 0-0 │ 0-1 │ 0-2 │
          ├─────┼─────┼─────┤
          │ 1-0 │ 1-1 │ 1-2 │
          ├─────┼─────┼─────┤
          │ 2-0 │ 2-1 │ 2-2 │
          ├─────┼─────┼─────┤
          │ *   │ *   │ *   │
          └─────┴─────┴─────┘
        `
      }
    ];

    testCases.forEach(({ description, expectation, rowIndex, input, expectedOutput }) => {
      describe(description, () => {
        let result;
        beforeEach(() => {
          result = insertRowAfter(asciiTableToTableValues(input), rowIndex);
        });
        it(expectation, () => {
          expect(result).toStrictEqual(asciiTableToTableValues(expectedOutput));
        });
      });
    });
  });

  describe('deleteRow', () => {
    const testCases = [
      {
        description: 'when deleted at the first row',
        expectation: 'it should remove the row and shift the remaining rows up by one',
        rowIndex: 0,
        input: `
          ┌─────┬─────┬─────┐
          │ 0-0 │ 0-1 │ 0-2 │
          ├─────┼─────┼─────┤
          │ 1-0 │ 1-1 │ 1-2 │
          ├─────┼─────┼─────┤
          │ 2-0 │ 2-1 │ 2-2 │
          └─────┴─────┴─────┘
        `,
        expectedOutput: `
          ┌─────┬─────┬─────┐
          │ 1-0 │ 1-1 │ 1-2 │
          ├─────┼─────┼─────┤
          │ 2-0 │ 2-1 │ 2-2 │
          └─────┴─────┴─────┘
        `
      },
      {
        description: 'when deleted at the last row',
        expectation: 'it should delete the row',
        rowIndex: 2,
        input: `
          ┌─────┬─────┬─────┐
          │ 0-0 │ 0-1 │ 0-2 │
          ├─────┼─────┼─────┤
          │ 1-0 │ 1-1 │ 1-2 │
          ├─────┼─────┼─────┤
          │ 2-0 │ 2-1 │ 2-2 │
          └─────┴─────┴─────┘
        `,
        expectedOutput: `
          ┌─────┬─────┬─────┐
          │ 0-0 │ 0-1 │ 0-2 │
          ├─────┼─────┼─────┤
          │ 1-0 │ 1-1 │ 1-2 │
          └─────┴─────┴─────┘
        `
      },
      {
        description: 'when deleted in the middle',
        expectation: 'it should delete the row and shift the remaining rows up by one',
        rowIndex: 1,
        input: `
          ┌─────┬─────┬─────┐
          │ 0-0 │ 0-1 │ 0-2 │
          ├─────┼─────┼─────┤
          │ 1-0 │ 1-1 │ 1-2 │
          ├─────┼─────┼─────┤
          │ 2-0 │ 2-1 │ 2-2 │
          └─────┴─────┴─────┘
        `,
        expectedOutput: `
          ┌─────┬─────┬─────┐
          │ 0-0 │ 0-1 │ 0-2 │
          ├─────┼─────┼─────┤
          │ 2-0 │ 2-1 │ 2-2 │
          └─────┴─────┴─────┘
        `
      }
    ];

    testCases.forEach(({ description, expectation, rowIndex, input, expectedOutput }) => {
      describe(description, () => {
        let result;
        beforeEach(() => {
          result = deleteRow(asciiTableToTableValues(input), rowIndex);
        });
        it(expectation, () => {
          expect(result).toStrictEqual(asciiTableToTableValues(expectedOutput));
        });
      });
    });
  });

  describe('insertColumnBefore', () => {
    const testCases = [
      {
        description: 'when inserted before the first column',
        expectation: 'it should insert the new column and shift the remaining columns right by one',
        columnIndex: 0,
        input: `
          ┌─────┬─────┬─────┐
          │ 0-0 │ 0-1 │ 0-2 │
          ├─────┼─────┼─────┤
          │ 1-0 │ 1-1 │ 1-2 │
          ├─────┼─────┼─────┤
          │ 2-0 │ 2-1 │ 2-2 │
          └─────┴─────┴─────┘
        `,
        expectedOutput: `
          ┌─────┬─────┬─────┬─────┐
          │ *   │ 0-0 │ 0-1 │ 0-2 │
          ├─────┼─────┼─────┼─────┤
          │ *   │ 1-0 │ 1-1 │ 1-2 │
          ├─────┼─────┼─────┼─────┤
          │ *   │ 2-0 │ 2-1 │ 2-2 │
          └─────┴─────┴─────┴─────┘
        `
      },
      {
        description: 'when inserted before the last column',
        expectation: 'it should insert the new column and shift the last column right by one',
        columnIndex: 2,
        input: `
          ┌─────┬─────┬─────┐
          │ 0-0 │ 0-1 │ 0-2 │
          ├─────┼─────┼─────┤
          │ 1-0 │ 1-1 │ 1-2 │
          ├─────┼─────┼─────┤
          │ 2-0 │ 2-1 │ 2-2 │
          └─────┴─────┴─────┘
        `,
        expectedOutput: `
          ┌─────┬─────┬─────┬─────┐
          │ 0-0 │ 0-1 │ *   │ 0-2 │
          ├─────┼─────┼─────┼─────┤
          │ 1-0 │ 1-1 │ *   │ 1-2 │
          ├─────┼─────┼─────┼─────┤
          │ 2-0 │ 2-1 │ *   │ 2-2 │
          └─────┴─────┴─────┴─────┘
        `
      },
      {
        description: 'when inserted before a column in the middle',
        expectation: 'it should insert the new column and shift the remaining columns right by one',
        columnIndex: 1,
        input: `
          ┌─────┬─────┬─────┐
          │ 0-0 │ 0-1 │ 0-2 │
          ├─────┼─────┼─────┤
          │ 1-0 │ 1-1 │ 1-2 │
          ├─────┼─────┼─────┤
          │ 2-0 │ 2-1 │ 2-2 │
          └─────┴─────┴─────┘
        `,
        expectedOutput: `
          ┌─────┬─────┬─────┬─────┐
          │ 0-0 │ *   │ 0-1 │ 0-2 │
          ├─────┼─────┼─────┼─────┤
          │ 1-0 │ *   │ 1-1 │ 1-2 │
          ├─────┼─────┼─────┼─────┤
          │ 2-0 │ *   │ 2-1 │ 2-2 │
          └─────┴─────┴─────┴─────┘
        `
      }
    ];

    testCases.forEach(({ description, expectation, columnIndex, input, expectedOutput }) => {
      describe(description, () => {
        let result;
        beforeEach(() => {
          result = insertColumnBefore(asciiTableToTableValues(input), columnIndex);
        });
        it(expectation, () => {
          expect(result).toStrictEqual(asciiTableToTableValues(expectedOutput));
        });
      });
    });
  });

  describe('insertColumnAfter', () => {
    const testCases = [
      {
        description: 'when inserted after the first column',
        expectation: 'it should insert the new column and shift the remaining columns right by one',
        columnIndex: 0,
        input: `
          ┌─────┬─────┬─────┐
          │ 0-0 │ 0-1 │ 0-2 │
          ├─────┼─────┼─────┤
          │ 1-0 │ 1-1 │ 1-2 │
          ├─────┼─────┼─────┤
          │ 2-0 │ 2-1 │ 2-2 │
          └─────┴─────┴─────┘
        `,
        expectedOutput: `
          ┌─────┬─────┬─────┬─────┐
          │ 0-0 │ *   │ 0-1 │ 0-2 │
          ├─────┼─────┼─────┼─────┤
          │ 1-0 │ *   │ 1-1 │ 1-2 │
          ├─────┼─────┼─────┼─────┤
          │ 2-0 │ *   │ 2-1 │ 2-2 │
          └─────┴─────┴─────┴─────┘
        `
      },
      {
        description: 'when inserted after the last column',
        expectation: 'it should insert the new column at the end',
        columnIndex: 2,
        input: `
          ┌─────┬─────┬─────┐
          │ 0-0 │ 0-1 │ 0-2 │
          ├─────┼─────┼─────┤
          │ 1-0 │ 1-1 │ 1-2 │
          ├─────┼─────┼─────┤
          │ 2-0 │ 2-1 │ 2-2 │
          └─────┴─────┴─────┘
        `,
        expectedOutput: `
          ┌─────┬─────┬─────┬─────┐
          │ 0-0 │ 0-1 │ 0-2 │ *   │
          ├─────┼─────┼─────┼─────┤
          │ 1-0 │ 1-1 │ 1-2 │ *   │
          ├─────┼─────┼─────┼─────┤
          │ 2-0 │ 2-1 │ 2-2 │ *   │
          └─────┴─────┴─────┴─────┘
        `
      }
    ];

    testCases.forEach(({ description, expectation, columnIndex, input, expectedOutput }) => {
      describe(description, () => {
        let result;
        beforeEach(() => {
          result = insertColumnAfter(asciiTableToTableValues(input), columnIndex);
        });
        it(expectation, () => {
          expect(result).toStrictEqual(asciiTableToTableValues(expectedOutput));
        });
      });
    });
  });

  describe('deleteColumn', () => {
    const testCases = [
      {
        description: 'when deleted at the first column',
        expectation: 'it should remove the column and shift the remaining columns left by one',
        columnIndex: 0,
        input: `
          ┌─────┬─────┬─────┐
          │ 0-0 │ 0-1 │ 0-2 │
          ├─────┼─────┼─────┤
          │ 1-0 │ 1-1 │ 1-2 │
          ├─────┼─────┼─────┤
          │ 2-0 │ 2-1 │ 2-2 │
          └─────┴─────┴─────┘
        `,
        expectedOutput: `
          ┌─────┬─────┐
          │ 0-1 │ 0-2 │
          ├─────┼─────┤
          │ 1-1 │ 1-2 │
          ├─────┼─────┤
          │ 2-1 │ 2-2 │
          └─────┴─────┘
        `
      },
      {
        description: 'when deleted at the last column',
        expectation: 'it should delete the column',
        columnIndex: 2,
        input: `
          ┌─────┬─────┬─────┐
          │ 0-0 │ 0-1 │ 0-2 │
          ├─────┼─────┼─────┤
          │ 1-0 │ 1-1 │ 1-2 │
          ├─────┼─────┼─────┤
          │ 2-0 │ 2-1 │ 2-2 │
          └─────┴─────┴─────┘
        `,
        expectedOutput: `
          ┌─────┬─────┐
          │ 0-0 │ 0-1 │
          ├─────┼─────┤
          │ 1-0 │ 1-1 │
          ├─────┼─────┤
          │ 2-0 │ 2-1 │
          └─────┴─────┘
        `
      },
      {
        description: 'when deleted in the middle',
        expectation: 'it should delete the column and shift the remaining columns left by one',
        columnIndex: 1,
        input: `
          ┌─────┬─────┬─────┐
          │ 0-0 │ 0-1 │ 0-2 │
          ├─────┼─────┼─────┤
          │ 1-0 │ 1-1 │ 1-2 │
          ├─────┼─────┼─────┤
          │ 2-0 │ 2-1 │ 2-2 │
          └─────┴─────┴─────┘
        `,
        expectedOutput: `
          ┌─────┬─────┐
          │ 0-0 │ 0-2 │
          ├─────┼─────┤
          │ 1-0 │ 1-2 │
          ├─────┼─────┤
          │ 2-0 │ 2-2 │
          └─────┴─────┘
        `
      }
    ];

    testCases.forEach(({ description, expectation, columnIndex, input, expectedOutput }) => {
      describe(description, () => {
        let result;
        beforeEach(() => {
          result = deleteColumn(asciiTableToTableValues(input), columnIndex);
        });
        it(expectation, () => {
          expect(result).toStrictEqual(asciiTableToTableValues(expectedOutput));
        });
      });
    });
  });

});
