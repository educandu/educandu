import { EOL } from 'node:os';
import { createEmptyCell } from './table-utils.js';

/*

Helper function to convert an ASCII table into the data model used by the table plugin
===================================================================================================

Rules:
  * Only the following characters are allowed for drawing the grid: ┌ ┐ ┘ └ ┬ ┤ ┴ ├ ─ │
  * None of these characters can occur in the actual text content of a cell
  * All rows must have an equal number of columns
  * All columns must have an equal number of rows
  * Rows cannot span multiple lines, for a double line break (\n\n) use the character `/`
  * Merged cells must build a rectangular area
  * Row content is interpreted such that:
    * `<<` means: merge with the cell(s) to the left
    * `^^` means: merge with the cell(s) above
    * all other values are considered text of the cell

---------------------------------------------------------------------------------------------------

For example, the folllowing string ...

┌─────┬─────┬─────┐
│ aaa │ bbb │ c/c │
├─────┼─────┼─────┤
│ ddd │ eee │ <<  │
├─────┼─────┼─────┤
│ f/f │ ^^  │ <<  │
└─────┴─────┴─────┘

... gets converted into ...

{
  rowCount: 3,
  columnCount: 3,
  cells: [
    { rowIndex: 0, columnIndex: 0, rowSpan: 1, columnSpan: 1, text: 'aaa' },
    { rowIndex: 0, columnIndex: 1, rowSpan: 1, columnSpan: 1, text: 'bbb' },
    { rowIndex: 0, columnIndex: 2, rowSpan: 1, columnSpan: 1, text: 'ccc' },
    { rowIndex: 1, columnIndex: 0, rowSpan: 1, columnSpan: 1, text: 'ddd' },
    { rowIndex: 1, columnIndex: 1, rowSpan: 2, columnSpan: 2, text: 'eee' },
    { rowIndex: 2, columnIndex: 0, rowSpan: 1, columnSpan: 1, text: 'f\n\nf' }
  ]
}

*/
export function asciiTableToTableValues(asciiTable) {
  const mergeMarkerLeft = Symbol('merge-left');
  const mergeMarkerTop = Symbol('merge-top');

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
      switch (rawCellContent) {
        case '<<':
          cellMatrix[rowIndex][columnIndex] = mergeMarkerLeft;
          break;
        case '^^':
          cellMatrix[rowIndex][columnIndex] = mergeMarkerTop;
          break;
        default:
          cellMatrix[rowIndex][columnIndex] = { ...createEmptyCell(rowIndex, columnIndex), text: rawCellContent.replace(/\//g, '\n\n') };
          break;
      }
    }
  }

  const countCellsHorizontally = (rowIndex, columnIndex, predicate, currentSum = 0) => {
    return columnIndex < columnCount && predicate(cellMatrix[rowIndex][columnIndex])
      ? countCellsHorizontally(rowIndex, columnIndex + 1, predicate, currentSum + 1)
      : currentSum;
  };

  const countCellsVertically = (rowIndex, columnIndex, predicate, currentSum = 0) => {
    return rowIndex < rowCount && predicate(cellMatrix[rowIndex][columnIndex])
      ? countCellsVertically(rowIndex + 1, columnIndex, predicate, currentSum + 1)
      : currentSum;
  };

  // Collect final cells and their row and column spans:
  const cells = [];
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      const currentCell = cellMatrix[rowIndex][columnIndex];
      if (currentCell !== mergeMarkerLeft && currentCell !== mergeMarkerTop) {
        if (cellMatrix[rowIndex]?.[columnIndex + 1] === mergeMarkerLeft) {
          currentCell.columnSpan += countCellsHorizontally(rowIndex, columnIndex + 1, x => x === mergeMarkerLeft);
        }
        if (cellMatrix[rowIndex + 1]?.[columnIndex] === mergeMarkerTop) {
          currentCell.rowSpan += countCellsVertically(rowIndex + 1, columnIndex, x => x === mergeMarkerTop);
        }
        cells.push(currentCell);
      }
    }
  }

  return { rowCount, columnCount, cells };
}
