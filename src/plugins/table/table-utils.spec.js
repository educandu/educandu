/* eslint-disable max-lines */

import { asciiTableToTableValues } from './table-utils.spec.helper.js';
import { connectCells, createDesignerRowModel, deleteColumn, deleteRow, DESIGNER_CELL_TYPE, insertColumn, insertRow } from './table-utils.js';

describe('table-utils', () => {

  describe('createDesignerRowModel', () => {
    const createDefaultContentCell = values => ({
      key: '',
      cellType: DESIGNER_CELL_TYPE.content,
      rowIndex: -1,
      columnIndex: -1,
      rowSpan: 1,
      columnSpan: 1,
      text: '',
      isFirstInRow: false,
      isLastInRow: false,
      isFirstInColumn: false,
      isLastInColumn: false,
      isConnected: false,
      ...values
    });

    const testCases = [
      {
        description: 'when the table has no merged cells',
        expectation: 'it should create the correct designer rows',
        input: `
          ┌─────┬─────┬─────┬─────┐
          │ 0-0 │ 0-1 │ 0-2 │ 0-3 │
          ├─────┼─────┼─────┼─────┤
          │ 1-0 │ 1-1 │ 1-2 │ 1-3 │
          ├─────┼─────┼─────┼─────┤
          │ 2-0 │ 2-1 │ 2-2 │ 2-3 │
          ├─────┼─────┼─────┼─────┤
          │ 3-0 │ 3-1 │ 3-2 │ 3-3 │
          └─────┴─────┴─────┴─────┘
        `,
        expectedOutput: [
          [
            { key: `${DESIGNER_CELL_TYPE.corner}`, cellType: DESIGNER_CELL_TYPE.corner, rowIndex: -1, columnIndex: -1 },
            { key: `${DESIGNER_CELL_TYPE.columnHeader}-0`, cellType: DESIGNER_CELL_TYPE.columnHeader, rowIndex: -1, columnIndex: 0 },
            { key: `${DESIGNER_CELL_TYPE.columnHeader}-1`, cellType: DESIGNER_CELL_TYPE.columnHeader, rowIndex: -1, columnIndex: 1 },
            { key: `${DESIGNER_CELL_TYPE.columnHeader}-2`, cellType: DESIGNER_CELL_TYPE.columnHeader, rowIndex: -1, columnIndex: 2 },
            { key: `${DESIGNER_CELL_TYPE.columnHeader}-3`, cellType: DESIGNER_CELL_TYPE.columnHeader, rowIndex: -1, columnIndex: 3 }
          ],
          [
            { key: `${DESIGNER_CELL_TYPE.rowHeader}-0`, cellType: DESIGNER_CELL_TYPE.rowHeader, rowIndex: 0, columnIndex: -1 },
            { ...createDefaultContentCell({ key: expect.any(String), text: '0-0', rowIndex: 0, columnIndex: 0, isFirstInRow: true, isFirstInColumn: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '0-1', rowIndex: 0, columnIndex: 1, isFirstInColumn: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '0-2', rowIndex: 0, columnIndex: 2, isFirstInColumn: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '0-3', rowIndex: 0, columnIndex: 3, isLastInRow: true, isFirstInColumn: true }) }
          ],
          [
            { key: `${DESIGNER_CELL_TYPE.rowHeader}-1`, cellType: DESIGNER_CELL_TYPE.rowHeader, rowIndex: 1, columnIndex: -1 },
            { ...createDefaultContentCell({ key: expect.any(String), text: '1-0', rowIndex: 1, columnIndex: 0, isFirstInRow: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '1-1', rowIndex: 1, columnIndex: 1 }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '1-2', rowIndex: 1, columnIndex: 2 }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '1-3', rowIndex: 1, columnIndex: 3, isLastInRow: true }) }
          ],
          [
            { key: `${DESIGNER_CELL_TYPE.rowHeader}-2`, cellType: DESIGNER_CELL_TYPE.rowHeader, rowIndex: 2, columnIndex: -1 },
            { ...createDefaultContentCell({ key: expect.any(String), text: '2-0', rowIndex: 2, columnIndex: 0, isFirstInRow: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '2-1', rowIndex: 2, columnIndex: 1 }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '2-2', rowIndex: 2, columnIndex: 2 }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '2-3', rowIndex: 2, columnIndex: 3, isLastInRow: true }) }
          ],
          [
            { key: `${DESIGNER_CELL_TYPE.rowHeader}-3`, cellType: DESIGNER_CELL_TYPE.rowHeader, rowIndex: 3, columnIndex: -1 },
            { ...createDefaultContentCell({ key: expect.any(String), text: '3-0', rowIndex: 3, columnIndex: 0, isFirstInRow: true, isLastInColumn: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '3-1', rowIndex: 3, columnIndex: 1, isLastInColumn: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '3-2', rowIndex: 3, columnIndex: 2, isLastInColumn: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '3-3', rowIndex: 3, columnIndex: 3, isLastInRow: true, isLastInColumn: true }) }
          ]
        ]
      },
      {
        description: 'when the table has merged cells at the border',
        expectation: 'it should create the correct designer rows',
        input: `
          ┌─────┬─────┬─────┬─────┐
          │ 0-0 │ 0-1 │ 0-2 │ 0-3 │
          ├─────┼─────┼─────┼─────┤
          │ 1-0 │ 1-1 │ 1-2 │ 1-3 │
          ├─────┼─────┼─────┼─────┤
          │ 2-0 │ 2-1 │ 2-2 │ <<  │
          ├─────┼─────┼─────┼─────┤
          │ 3-0 │ 3-1 │ ^^  │ ^^  │
          └─────┴─────┴─────┴─────┘
        `,
        expectedOutput: [
          [
            { key: `${DESIGNER_CELL_TYPE.corner}`, cellType: DESIGNER_CELL_TYPE.corner, rowIndex: -1, columnIndex: -1 },
            { key: `${DESIGNER_CELL_TYPE.columnHeader}-0`, cellType: DESIGNER_CELL_TYPE.columnHeader, rowIndex: -1, columnIndex: 0 },
            { key: `${DESIGNER_CELL_TYPE.columnHeader}-1`, cellType: DESIGNER_CELL_TYPE.columnHeader, rowIndex: -1, columnIndex: 1 },
            { key: `${DESIGNER_CELL_TYPE.columnHeader}-2`, cellType: DESIGNER_CELL_TYPE.columnHeader, rowIndex: -1, columnIndex: 2 },
            { key: `${DESIGNER_CELL_TYPE.columnHeader}-3`, cellType: DESIGNER_CELL_TYPE.columnHeader, rowIndex: -1, columnIndex: 3 }
          ],
          [
            { key: `${DESIGNER_CELL_TYPE.rowHeader}-0`, cellType: DESIGNER_CELL_TYPE.rowHeader, rowIndex: 0, columnIndex: -1 },
            { ...createDefaultContentCell({ key: expect.any(String), text: '0-0', rowIndex: 0, columnIndex: 0, isFirstInRow: true, isFirstInColumn: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '0-1', rowIndex: 0, columnIndex: 1, isFirstInColumn: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '0-2', rowIndex: 0, columnIndex: 2, isFirstInColumn: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '0-3', rowIndex: 0, columnIndex: 3, isLastInRow: true, isFirstInColumn: true }) }
          ],
          [
            { key: `${DESIGNER_CELL_TYPE.rowHeader}-1`, cellType: DESIGNER_CELL_TYPE.rowHeader, rowIndex: 1, columnIndex: -1 },
            { ...createDefaultContentCell({ key: expect.any(String), text: '1-0', rowIndex: 1, columnIndex: 0, isFirstInRow: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '1-1', rowIndex: 1, columnIndex: 1 }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '1-2', rowIndex: 1, columnIndex: 2 }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '1-3', rowIndex: 1, columnIndex: 3, isLastInRow: true }) }
          ],
          [
            { key: `${DESIGNER_CELL_TYPE.rowHeader}-2`, cellType: DESIGNER_CELL_TYPE.rowHeader, rowIndex: 2, columnIndex: -1 },
            { ...createDefaultContentCell({ key: expect.any(String), text: '2-0', rowIndex: 2, columnIndex: 0, isFirstInRow: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '2-1', rowIndex: 2, columnIndex: 1 }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '2-2', rowIndex: 2, columnIndex: 2, rowSpan: 2, columnSpan: 2, isLastInRow: true, isLastInColumn: true, isConnected: true }) }
          ],
          [
            { key: `${DESIGNER_CELL_TYPE.rowHeader}-3`, cellType: DESIGNER_CELL_TYPE.rowHeader, rowIndex: 3, columnIndex: -1 },
            { ...createDefaultContentCell({ key: expect.any(String), text: '3-0', rowIndex: 3, columnIndex: 0, isFirstInRow: true, isLastInColumn: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '3-1', rowIndex: 3, columnIndex: 1, isLastInColumn: true }) }
          ]
        ]
      },
      {
        description: 'when the table has merged cells in the middle',
        expectation: 'it should create the correct designer rows',
        input: `
          ┌─────┬─────┬─────┬─────┐
          │ 0-0 │ 0-1 │ 0-2 │ 0-3 │
          ├─────┼─────┼─────┼─────┤
          │ 1-0 │ 1-1 │ <<  │ 1-3 │
          ├─────┼─────┼─────┼─────┤
          │ 2-0 │ ^^  │ ^^  │ 2-3 │
          ├─────┼─────┼─────┼─────┤
          │ 3-0 │ 3-1 │ 3-2 │ 3-3 │
          └─────┴─────┴─────┴─────┘
      `,
        expectedOutput: [
          [
            { key: `${DESIGNER_CELL_TYPE.corner}`, cellType: DESIGNER_CELL_TYPE.corner, rowIndex: -1, columnIndex: -1 },
            { key: `${DESIGNER_CELL_TYPE.columnHeader}-0`, cellType: DESIGNER_CELL_TYPE.columnHeader, rowIndex: -1, columnIndex: 0 },
            { key: `${DESIGNER_CELL_TYPE.columnHeader}-1`, cellType: DESIGNER_CELL_TYPE.columnHeader, rowIndex: -1, columnIndex: 1 },
            { key: `${DESIGNER_CELL_TYPE.columnHeader}-2`, cellType: DESIGNER_CELL_TYPE.columnHeader, rowIndex: -1, columnIndex: 2 },
            { key: `${DESIGNER_CELL_TYPE.columnHeader}-3`, cellType: DESIGNER_CELL_TYPE.columnHeader, rowIndex: -1, columnIndex: 3 }
          ],
          [
            { key: `${DESIGNER_CELL_TYPE.rowHeader}-0`, cellType: DESIGNER_CELL_TYPE.rowHeader, rowIndex: 0, columnIndex: -1 },
            { ...createDefaultContentCell({ key: expect.any(String), text: '0-0', rowIndex: 0, columnIndex: 0, isFirstInRow: true, isFirstInColumn: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '0-1', rowIndex: 0, columnIndex: 1, isFirstInColumn: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '0-2', rowIndex: 0, columnIndex: 2, isFirstInColumn: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '0-3', rowIndex: 0, columnIndex: 3, isLastInRow: true, isFirstInColumn: true }) }
          ],
          [
            { key: `${DESIGNER_CELL_TYPE.rowHeader}-1`, cellType: DESIGNER_CELL_TYPE.rowHeader, rowIndex: 1, columnIndex: -1 },
            { ...createDefaultContentCell({ key: expect.any(String), text: '1-0', rowIndex: 1, columnIndex: 0, isFirstInRow: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '1-1', rowIndex: 1, columnIndex: 1, rowSpan: 2, columnSpan: 2, isConnected: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '1-3', rowIndex: 1, columnIndex: 3, isLastInRow: true }) }
          ],
          [
            { key: `${DESIGNER_CELL_TYPE.rowHeader}-2`, cellType: DESIGNER_CELL_TYPE.rowHeader, rowIndex: 2, columnIndex: -1 },
            { ...createDefaultContentCell({ key: expect.any(String), text: '2-0', rowIndex: 2, columnIndex: 0, isFirstInRow: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '2-3', rowIndex: 2, columnIndex: 3, isLastInRow: true }) }
          ],
          [
            { key: `${DESIGNER_CELL_TYPE.rowHeader}-3`, cellType: DESIGNER_CELL_TYPE.rowHeader, rowIndex: 3, columnIndex: -1 },
            { ...createDefaultContentCell({ key: expect.any(String), text: '3-0', rowIndex: 3, columnIndex: 0, isFirstInRow: true, isLastInColumn: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '3-1', rowIndex: 3, columnIndex: 1, isLastInColumn: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '3-2', rowIndex: 3, columnIndex: 2, isLastInColumn: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '3-3', rowIndex: 3, columnIndex: 3, isLastInRow: true, isLastInColumn: true }) }
          ]
        ]
      },
      {
        description: 'when the table has rows where all cells are merged to top',
        expectation: 'it should create the correct designer rows (including the row without content cells)',
        input: `
          ┌─────┬─────┬─────┬─────┐
          │ 0-0 │ 0-1 │ 0-2 │ 0-3 │
          ├─────┼─────┼─────┼─────┤
          │ 1-0 │ 1-1 │ 1-2 │ 1-3 │
          ├─────┼─────┼─────┼─────┤
          │ 2-0 │ 2-1 │ 2-2 │ 2-3 │
          ├─────┼─────┼─────┼─────┤
          │ ^^  │ ^^  │ ^^  │ ^^  │
          └─────┴─────┴─────┴─────┘
        `,
        expectedOutput: [
          [
            { key: `${DESIGNER_CELL_TYPE.corner}`, cellType: DESIGNER_CELL_TYPE.corner, rowIndex: -1, columnIndex: -1 },
            { key: `${DESIGNER_CELL_TYPE.columnHeader}-0`, cellType: DESIGNER_CELL_TYPE.columnHeader, rowIndex: -1, columnIndex: 0 },
            { key: `${DESIGNER_CELL_TYPE.columnHeader}-1`, cellType: DESIGNER_CELL_TYPE.columnHeader, rowIndex: -1, columnIndex: 1 },
            { key: `${DESIGNER_CELL_TYPE.columnHeader}-2`, cellType: DESIGNER_CELL_TYPE.columnHeader, rowIndex: -1, columnIndex: 2 },
            { key: `${DESIGNER_CELL_TYPE.columnHeader}-3`, cellType: DESIGNER_CELL_TYPE.columnHeader, rowIndex: -1, columnIndex: 3 }
          ],
          [
            { key: `${DESIGNER_CELL_TYPE.rowHeader}-0`, cellType: DESIGNER_CELL_TYPE.rowHeader, rowIndex: 0, columnIndex: -1 },
            { ...createDefaultContentCell({ key: expect.any(String), text: '0-0', rowIndex: 0, columnIndex: 0, isFirstInRow: true, isFirstInColumn: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '0-1', rowIndex: 0, columnIndex: 1, isFirstInColumn: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '0-2', rowIndex: 0, columnIndex: 2, isFirstInColumn: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '0-3', rowIndex: 0, columnIndex: 3, isLastInRow: true, isFirstInColumn: true }) }
          ],
          [
            { key: `${DESIGNER_CELL_TYPE.rowHeader}-1`, cellType: DESIGNER_CELL_TYPE.rowHeader, rowIndex: 1, columnIndex: -1 },
            { ...createDefaultContentCell({ key: expect.any(String), text: '1-0', rowIndex: 1, columnIndex: 0, isFirstInRow: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '1-1', rowIndex: 1, columnIndex: 1 }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '1-2', rowIndex: 1, columnIndex: 2 }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '1-3', rowIndex: 1, columnIndex: 3, isLastInRow: true }) }
          ],
          [
            { key: `${DESIGNER_CELL_TYPE.rowHeader}-2`, cellType: DESIGNER_CELL_TYPE.rowHeader, rowIndex: 2, columnIndex: -1 },
            { ...createDefaultContentCell({ key: expect.any(String), text: '2-0', rowIndex: 2, columnIndex: 0, rowSpan: 2, isFirstInRow: true, isLastInColumn: true, isConnected: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '2-1', rowIndex: 2, columnIndex: 1, rowSpan: 2, isLastInColumn: true, isConnected: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '2-2', rowIndex: 2, columnIndex: 2, rowSpan: 2, isLastInColumn: true, isConnected: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '2-3', rowIndex: 2, columnIndex: 3, rowSpan: 2, isLastInRow: true }), isLastInColumn: true, isConnected: true }
          ],
          [{ key: `${DESIGNER_CELL_TYPE.rowHeader}-3`, cellType: DESIGNER_CELL_TYPE.rowHeader, rowIndex: 3, columnIndex: -1 }]
        ]
      },
      {
        description: 'when the table has columns where all cells are merged to left',
        expectation: 'it should create the correct designer rows (including the column without content cells)',
        input: `
          ┌─────┬─────┬─────┬─────┐
          │ 0-0 │ 0-1 │ 0-2 │ <<  │
          ├─────┼─────┼─────┼─────┤
          │ 1-0 │ 1-1 │ 1-2 │ <<  │
          ├─────┼─────┼─────┼─────┤
          │ 2-0 │ 2-1 │ 2-2 │ <<  │
          ├─────┼─────┼─────┼─────┤
          │ 3-0 │ 3-1 │ 3-2 │ <<  │
          └─────┴─────┴─────┴─────┘
        `,
        expectedOutput: [
          [
            { key: `${DESIGNER_CELL_TYPE.corner}`, cellType: DESIGNER_CELL_TYPE.corner, rowIndex: -1, columnIndex: -1 },
            { key: `${DESIGNER_CELL_TYPE.columnHeader}-0`, cellType: DESIGNER_CELL_TYPE.columnHeader, rowIndex: -1, columnIndex: 0 },
            { key: `${DESIGNER_CELL_TYPE.columnHeader}-1`, cellType: DESIGNER_CELL_TYPE.columnHeader, rowIndex: -1, columnIndex: 1 },
            { key: `${DESIGNER_CELL_TYPE.columnHeader}-2`, cellType: DESIGNER_CELL_TYPE.columnHeader, rowIndex: -1, columnIndex: 2 },
            { key: `${DESIGNER_CELL_TYPE.columnHeader}-3`, cellType: DESIGNER_CELL_TYPE.columnHeader, rowIndex: -1, columnIndex: 3 }
          ],
          [
            { key: `${DESIGNER_CELL_TYPE.rowHeader}-0`, cellType: DESIGNER_CELL_TYPE.rowHeader, rowIndex: 0, columnIndex: -1 },
            { ...createDefaultContentCell({ key: expect.any(String), text: '0-0', rowIndex: 0, columnIndex: 0, isFirstInRow: true, isFirstInColumn: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '0-1', rowIndex: 0, columnIndex: 1, isFirstInColumn: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '0-2', rowIndex: 0, columnIndex: 2, columnSpan: 2, isLastInRow: true, isFirstInColumn: true, isConnected: true }) }
          ],
          [
            { key: `${DESIGNER_CELL_TYPE.rowHeader}-1`, cellType: DESIGNER_CELL_TYPE.rowHeader, rowIndex: 1, columnIndex: -1 },
            { ...createDefaultContentCell({ key: expect.any(String), text: '1-0', rowIndex: 1, columnIndex: 0, isFirstInRow: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '1-1', rowIndex: 1, columnIndex: 1 }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '1-2', rowIndex: 1, columnIndex: 2, columnSpan: 2, isLastInRow: true, isConnected: true }) }
          ],
          [
            { key: `${DESIGNER_CELL_TYPE.rowHeader}-2`, cellType: DESIGNER_CELL_TYPE.rowHeader, rowIndex: 2, columnIndex: -1 },
            { ...createDefaultContentCell({ key: expect.any(String), text: '2-0', rowIndex: 2, columnIndex: 0, isFirstInRow: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '2-1', rowIndex: 2, columnIndex: 1 }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '2-2', rowIndex: 2, columnIndex: 2, columnSpan: 2, isLastInRow: true, isConnected: true }) }
          ],
          [
            { key: `${DESIGNER_CELL_TYPE.rowHeader}-3`, cellType: DESIGNER_CELL_TYPE.rowHeader, rowIndex: 3, columnIndex: -1 },
            { ...createDefaultContentCell({ key: expect.any(String), text: '3-0', rowIndex: 3, columnIndex: 0, isFirstInRow: true, isLastInColumn: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '3-1', rowIndex: 3, columnIndex: 1, isLastInColumn: true }) },
            { ...createDefaultContentCell({ key: expect.any(String), text: '3-2', rowIndex: 3, columnIndex: 2, columnSpan: 2, isLastInRow: true, isLastInColumn: true, isConnected: true }) }
          ]
        ]
      }
    ];

    testCases.forEach(({ description, expectation, input, expectedOutput }) => {
      describe(description, () => {
        let result;
        beforeEach(() => {
          result = createDesignerRowModel(asciiTableToTableValues(input));
        });
        it(expectation, () => {
          expect(result).toStrictEqual(expectedOutput);
        });
      });
    });
  });

  describe('insertRow', () => {
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
          │     │     │     │
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
        description: 'when inserted after the first row',
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
          │     │     │     │
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
          │     │     │     │
          ├─────┼─────┼─────┤
          │ 2-0 │ 2-1 │ 2-2 │
          └─────┴─────┴─────┘
        `
      },
      {
        description: 'when inserted after the last row',
        expectation: 'it should insert the new row at the end',
        rowIndex: 3,
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
          │     │     │     │
          └─────┴─────┴─────┘
        `
      },
      {
        description: 'when the inserted row would separate a connected cell',
        expectation: 'it should include the newly inserted row into the cell connection',
        rowIndex: 2,
        input: `
          ┌─────┬─────┬─────┐
          │ 0-0 │ 0-1 │ 0-2 │
          ├─────┼─────┼─────┤
          │ 1-0 │ 1-1 │ 1-2 │
          ├─────┼─────┼─────┤
          │ 2-0 │ ^^  │ 2-2 │
          └─────┴─────┴─────┘
        `,
        expectedOutput: `
          ┌─────┬─────┬─────┐
          │ 0-0 │ 0-1 │ 0-2 │
          ├─────┼─────┼─────┤
          │ 1-0 │ 1-1 │ 1-2 │
          ├─────┼─────┼─────┤
          │     │ ^^  │     │
          ├─────┼─────┼─────┤
          │ 2-0 │ ^^  │ 2-2 │
          └─────┴─────┴─────┘
        `
      }
    ];

    testCases.forEach(({ description, expectation, rowIndex, input, expectedOutput }) => {
      describe(description, () => {
        let result;
        beforeEach(() => {
          result = insertRow(asciiTableToTableValues(input), rowIndex);
        });
        it(expectation, () => {
          expect(result).toStrictEqual(asciiTableToTableValues(expectedOutput, () => expect.any(String)));
        });
      });
    });
  });

  describe('insertColumn', () => {
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
          │     │ 0-0 │ 0-1 │ 0-2 │
          ├─────┼─────┼─────┼─────┤
          │     │ 1-0 │ 1-1 │ 1-2 │
          ├─────┼─────┼─────┼─────┤
          │     │ 2-0 │ 2-1 │ 2-2 │
          └─────┴─────┴─────┴─────┘
        `
      },
      {
        description: 'when inserted after the first column',
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
          │ 0-0 │     │ 0-1 │ 0-2 │
          ├─────┼─────┼─────┼─────┤
          │ 1-0 │     │ 1-1 │ 1-2 │
          ├─────┼─────┼─────┼─────┤
          │ 2-0 │     │ 2-1 │ 2-2 │
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
          │ 0-0 │ 0-1 │     │ 0-2 │
          ├─────┼─────┼─────┼─────┤
          │ 1-0 │ 1-1 │     │ 1-2 │
          ├─────┼─────┼─────┼─────┤
          │ 2-0 │ 2-1 │     │ 2-2 │
          └─────┴─────┴─────┴─────┘
        `
      },
      {
        description: 'when inserted after the last column',
        expectation: 'it should insert the new column at the end',
        columnIndex: 3,
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
          │ 0-0 │ 0-1 │ 0-2 │     │
          ├─────┼─────┼─────┼─────┤
          │ 1-0 │ 1-1 │ 1-2 │     │
          ├─────┼─────┼─────┼─────┤
          │ 2-0 │ 2-1 │ 2-2 │     │
          └─────┴─────┴─────┴─────┘
        `
      },
      {
        description: 'when the inserted column would separate a connected cell',
        expectation: 'it should include the newly inserted column into the cell connection',
        columnIndex: 2,
        input: `
          ┌─────┬─────┬─────┐
          │ 0-0 │ 0-1 │ 0-2 │
          ├─────┼─────┼─────┤
          │ 1-0 │ 1-1 │ <<  │
          ├─────┼─────┼─────┤
          │ 2-0 │ 2-1 │ 2-2 │
          └─────┴─────┴─────┘
        `,
        expectedOutput: `
          ┌─────┬─────┬─────┬─────┐
          │ 0-0 │ 0-1 │     │ 0-2 │
          ├─────┼─────┼─────┼─────┤
          │ 1-0 │ 1-1 │ <<  │ <<  │
          ├─────┼─────┼─────┼─────┤
          │ 2-0 │ 2-1 │     │ 2-2 │
          └─────┴─────┴─────┴─────┘
        `
      }
    ];

    testCases.forEach(({ description, expectation, columnIndex, input, expectedOutput }) => {
      describe(description, () => {
        let result;
        beforeEach(() => {
          result = insertColumn(asciiTableToTableValues(input), columnIndex);
        });
        it(expectation, () => {
          expect(result).toStrictEqual(asciiTableToTableValues(expectedOutput, () => expect.any(String)));
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
      },
      {
        description: 'when the deleted row has combined cells',
        expectation: 'it should delete the row and adjust the combined rows\' row spans',
        rowIndex: 1,
        input: `
          ┌─────┬─────┬─────┬─────┐
          │ 0-0 │ 0-1 │ 0-2 │ 0-3 │
          ├─────┼─────┼─────┼─────┤
          │ 1-0 │ ^^  │ ^^  │ 1-3 │
          ├─────┼─────┼─────┼─────┤
          │ ^^  │ 2-1 │ ^^  │ 2-3 │
          └─────┴─────┴─────┴─────┘
        `,
        expectedOutput: `
          ┌─────┬─────┬─────┬─────┐
          │ 0-0 │ 0-1 │ 0-2 │ 0-3 │
          ├─────┼─────┼─────┼─────┤
          │ 1-0 │ 2-1 │ ^^  │ 2-3 │
          └─────┴─────┴─────┴─────┘
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
          expect(result).toStrictEqual(asciiTableToTableValues(expectedOutput, () => expect.any(String)));
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
      },
      {
        description: 'when the deleted column has combined cells',
        expectation: 'it should delete the column and adjust the combined columns\' column spans',
        columnIndex: 1,
        input: `
          ┌─────┬─────┬─────┐
          │ 0-0 │ 0-1 │ 0-2 │
          ├─────┼─────┼─────┤
          │ 1-0 │ <<  │ <<  │
          ├─────┼─────┼─────┤
          │ 2-0 │ <<  │ 2-2 │
          ├─────┼─────┼─────┤
          │ 3-0 │ 3-1 │ <<  │
          └─────┴─────┴─────┘
        `,
        expectedOutput: `
          ┌─────┬─────┐
          │ 0-0 │ 0-2 │
          ├─────┼─────┤
          │ 1-0 │ <<  │
          ├─────┼─────┤
          │ 2-0 │ 2-2 │
          ├─────┼─────┤
          │ 3-0 │ 3-1 │
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
          expect(result).toStrictEqual(asciiTableToTableValues(expectedOutput, () => expect.any(String)));
        });
      });
    });
  });

  describe('connectCells', () => {
    const testCases = [
      {
        description: 'when applied to a single disconnected cell',
        expectation: 'it should not modify the table structure',
        area: { fromRowIndex: 1, fromColumnIndex: 1, toRowIndex: 1, toColumnIndex: 1 },
        input: `
          ┌─────┬─────┬─────┐
          │  a  │  b  │  c  │
          ├─────┼─────┼─────┤
          │  d  │  e  │  f  │
          ├─────┼─────┼─────┤
          │  g  │  h  │  i  │
          └─────┴─────┴─────┘
        `,
        expectedOutput: `
          ┌─────┬───────┬─────┐
          │  a  │  b    │  c  │
          ├─────┼───────┼─────┤
          │  d  │    e  │  f  │
          ├─────┼───────┼─────┤
          │  g  │  h    │  i  │
          └─────┴───────┴─────┘
        `
      },
      {
        description: 'when applied to an area with exclusively disconnected cells',
        expectation: 'it should connect that exact area',
        area: { fromRowIndex: 1, fromColumnIndex: 1, toRowIndex: 2, toColumnIndex: 2 },
        input: `
          ┌─────┬─────┬─────┐
          │  a  │  b  │  c  │
          ├─────┼─────┼─────┤
          │  d  │  e  │  f  │
          ├─────┼─────┼─────┤
          │  g  │  h  │  i  │
          └─────┴─────┴─────┘
        `,
        expectedOutput: `
          ┌─────┬───────────┬──────┐
          │  a  │  b        │  c   │
          ├─────┼───────────┼──────┤
          │  d  │  e/f/h/i  │  <<  │
          ├─────┼───────────┼──────┤
          │  g  │  ^^       │  ^^  │
          └─────┴───────────┴──────┘
        `
      },
      {
        description: 'when applied to an area that includes surrounding connected cells',
        expectation: 'it should expand the connected area to the next possible rectangular shape',
        area: { fromRowIndex: 3, fromColumnIndex: 2, toRowIndex: 3, toColumnIndex: 4 },
        input: `
          ┌──────┬──────┬──────┬──────┬───────┬───────┬───────┬──────┐
          │  a   │  b   │  c   │  d   │  e    │  f    │  g    │  h   │
          ├──────┼──────┼──────┼──────┼───────┼───────┼───────┼──────┤
          │  i   │  ^^  │  j   │  k   │  l    │  <<   │  <<   │  m   │
          ├──────┼──────┼──────┼──────┼───────┼───────┼───────┼──────┤
          │  n   │  ^^  │  o   │  p   │  q    │  r    │  s    │  t   │
          ├──────┼──────┼──────┼──────┼───────┼───────┼───────┼──────┤
          │  u   │  v   │  ^^  │  w   │  ^^   │  x    │  y    │  z   │
          ├──────┼──────┼──────┼──────┼───────┼───────┼───────┼──────┤
          │  aa  │  bb  │  <<  │  dd  │  ^^   │  ee   │  ff   │  gg  │
          ├──────┼──────┼──────┼──────┼───────┼───────┼───────┼──────┤
          │  hh  │  ii  │  jj  │  kk  │  ll   │  mm   │  nn   │  oo  │
          ├──────┼──────┼──────┼──────┼───────┼───────┼───────┼──────┤
          │  pp  │  qq  │  rr  │  ss  │  ^^   │  tt   │  uu   │  vv  │
          ├──────┼──────┼──────┼──────┼───────┼───────┼───────┼──────┤
          │  ww  │  xx  │  yy  │  zz  │  aaa  │  bbb  │  ccc  │  ^^  │
          └──────┴──────┴──────┴──────┴───────┴───────┴───────┴──────┘
        `,
        expectedOutput: `
          ┌──────┬───────────────────────────────────────────────────┬──────┬──────┬───────┬───────┬───────┬──────┐
          │  a   │  b/c/d/e/f/g/j/k/l/o/p/q/r/s/v/w/x/y/bb/dd/ee/ff  │  <<  │  <<  │  <<   │  <<   │  <<   │  h   │
          ├──────┼───────────────────────────────────────────────────┼──────┼──────┼───────┼───────┼───────┼──────┤
          │  i   │  ^^                                               │  ^^  │  ^^  │  ^^   │  ^^   │  ^^   │  m   │
          ├──────┼───────────────────────────────────────────────────┼──────┼──────┼───────┼───────┼───────┼──────┤
          │  n   │  ^^                                               │  ^^  │  ^^  │  ^^   │  ^^   │  ^^   │  t   │
          ├──────┼───────────────────────────────────────────────────┼──────┼──────┼───────┼───────┼───────┼──────┤
          │  u   │  ^^                                               │  ^^  │  ^^  │  ^^   │  ^^   │  ^^   │  z   │
          ├──────┼───────────────────────────────────────────────────┼──────┼──────┼───────┼───────┼───────┼──────┤
          │  aa  │  ^^                                               │  ^^  │  ^^  │  ^^   │  ^^   │  ^^   │  gg  │
          ├──────┼───────────────────────────────────────────────────┼──────┼──────┼───────┼───────┼───────┼──────┤
          │  hh  │  ii                                               │  jj  │  kk  │  ll   │  mm   │  nn   │  oo  │
          ├──────┼───────────────────────────────────────────────────┼──────┼──────┼───────┼───────┼───────┼──────┤
          │  pp  │  qq                                               │  rr  │  ss  │  ^^   │  tt   │  uu   │  vv  │
          ├──────┼───────────────────────────────────────────────────┼──────┼──────┼───────┼───────┼───────┼──────┤
          │  ww  │  xx                                               │  yy  │  zz  │  aaa  │  bbb  │  ccc  │  ^^  │
          └──────┴───────────────────────────────────────────────────┴──────┴──────┴───────┴───────┴───────┴──────┘
        `
      }
    ];

    testCases.forEach(({ description, expectation, area, input, expectedOutput }) => {
      describe(description, () => {
        let result;
        beforeEach(() => {
          result = connectCells(asciiTableToTableValues(input), area);
        });
        it(expectation, () => {
          expect(result).toStrictEqual(asciiTableToTableValues(expectedOutput, () => expect.any(String)));
        });
      });
    });
  });

});
