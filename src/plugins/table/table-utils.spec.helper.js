import { EOL } from 'os';
import { createEmptyCell } from './table-utils.js';

/*

Helper function to convert an ASCII table into the data model used by the table plugin
===================================================================================================

Rules:
  * Only the following characters are allowed for drawing the grid: ┌ ┐ ┘ └ ┬ ┤ ┴ ├ ─ │
  * None of these characters can occur in the actual text content of a cell
  * All rows must have an equal number of columns
  * All columns must have an equal number of rows
  * Row content cannot span multiple lines
  * Row content is interpreted such that:
    * `<<` means: merge with the cell(s) to the left
    * `^^` means: merge with the cell(s) above
    * `*` means: set the cell key to `expect.any(String)` and the cell text to empty string
    * all other values mean: set the cell key and the cell text to this value

---------------------------------------------------------------------------------------------------

For example, the folllowing string ...

┌─────┬─────┬─────┐
│ *   │ *   │ *   │
├─────┼─────┼─────┤
│ aaa │ bbb │ ccc │
├─────┼─────┼─────┤
│ ddd │ eee │ <<  │
├─────┼─────┼─────┤
│ fff │ ^^  │ <<  │
└─────┴─────┴─────┘

... gets converted into ...

{
  rowCount: 4,
  columnCount: 3,
  cells: [
    { key: expect.any(String), rowIndex: 0, columnIndex: 0, rowSpan: 1, columnSpan: 1, text: '' },
    { key: expect.any(String), rowIndex: 0, columnIndex: 1, rowSpan: 1, columnSpan: 1, text: '' },
    { key: expect.any(String), rowIndex: 0, columnIndex: 2, rowSpan: 1, columnSpan: 1, text: '' },
    { key: 'aaa', rowIndex: 1, columnIndex: 0, rowSpan: 1, columnSpan: 1, text: 'aaa' },
    { key: 'bbb', rowIndex: 1, columnIndex: 1, rowSpan: 1, columnSpan: 1, text: 'bbb' },
    { key: 'ccc', rowIndex: 1, columnIndex: 2, rowSpan: 1, columnSpan: 1, text: 'ccc' },
    { key: 'ddd', rowIndex: 2, columnIndex: 0, rowSpan: 1, columnSpan: 1, text: 'ddd' },
    { key: 'eee', rowIndex: 2, columnIndex: 1, rowSpan: 2, columnSpan: 2, text: 'eee' },
    { key: 'fff', rowIndex: 3, columnIndex: 0, rowSpan: 1, columnSpan: 1, text: 'fff' }
  ]
}

*/
export function asciiTableToTableValues(asciiTable) {
  const parsedMatrix = asciiTable
    .split(EOL)
    .map(x => x.trim())
    .filter(x => x.startsWith('│'))
    .map(x => x.replace(/^│/, ''))
    .map(x => x.replace(/│$/, ''))
    .map(x => x.split('│').map(y => y.trim()));

  const rowCount = parsedMatrix.length;
  const columnCount = parsedMatrix[0].length;

  const cellMatrix = [];
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    cellMatrix[rowIndex] = [];
    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      const rawCellContent = parsedMatrix[rowIndex][columnIndex];
      const key = rawCellContent === '*' ? expect.any(String) : rawCellContent;
      const text = rawCellContent === '*' ? '' : rawCellContent;
      cellMatrix[rowIndex][columnIndex] = { ...createEmptyCell(rowIndex, columnIndex), key, text };
    }
  }

  // Here we have to process column and row spans!
  // (Will be done in https://educandu.atlassian.net/browse/EDU-503)

  return { rowCount, columnCount, cells: cellMatrix.flat() };
}
