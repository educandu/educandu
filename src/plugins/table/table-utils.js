import by from 'thenby';
import deepEqual from 'fast-deep-equal';
import { insertItemAt, removeItemAt } from '../../utils/array-utils.js';
import { HORIZONTAL_ALIGNMENT, VERTICAL_ALIGNMENT } from '../../domain/constants.js';

export const COLUMN_DISTRIBUTION = {
  automatic: 'automatic',
  even: 'even'
};

export const CELL_TYPE = {
  header: 'header',
  body: 'body'
};

export const DESIGNER_CELL_TYPE = {
  tableHeader: 'table-header',
  columnHeader: 'column-header',
  rowHeader: 'row-header',
  content: 'content'
};

export const DESIGNER_CELL_ACTION = {
  convertAllToHeaderCells: 'convert-all-to-header-cells',
  convertAllToBodyCells: 'convert-all-to-body-cells',
  convertToHeaderRow: 'convert-to-header-row',
  convertToBodyRow: 'convert-to-body-row',
  convertToHeaderColumn: 'convert-to-header-column',
  convertToBodyColumn: 'convert-to-body-column',
  convertToHeaderCell: 'convert-to-header-cell',
  convertToBodyCell: 'convert-to-body-cell',
  insertRowBefore: 'insert-row-before',
  insertRowAfter: 'insert-row-after',
  deleteRow: 'delete-row',
  insertColumnBefore: 'insert-column-before',
  insertColumnAfter: 'insert-column-after',
  deleteColumn: 'delete-column',
  connectToRowBefore: 'connect-to-row-before',
  connectToRowAfter: 'connect-to-row-after',
  connectToColumnBefore: 'connect-to-column-before',
  connectToColumnAfter: 'connect-to-column-after',
  disconnectAllCells: 'disconnect-all-cells',
  disconnectCell: 'disconnect-cell',
  setVerticalAlignmentToTop: 'set-vertical-alignment-to-top',
  setVerticalAlignmentToMiddle: 'set-vertical-alignment-to-middle',
  setVerticalAlignmentToBottom: 'set-vertical-alignment-to-bottom',
  setHorizontalAlignmentToLeft: 'set-horizontal-alignment-to-left',
  setHorizontalAlignmentToCenter: 'set-horizontal-alignment-to-center',
  setHorizontalAlignmentToRight: 'set-horizontal-alignment-to-right'
};

export function isCellAffected(cell, rowIndex, columnIndex) {
  const cellIsInRow = rowIndex === -1 || (cell.rowIndex <= rowIndex && cell.rowIndex + cell.rowSpan - 1 >= rowIndex);
  const cellIsInColumn = columnIndex === -1 || (cell.columnIndex <= columnIndex && cell.columnIndex + cell.columnSpan - 1 >= columnIndex);
  return cellIsInRow && cellIsInColumn;
}

export function calculateEvenColumnWidthsInPercent(columnCount) {
  if (!columnCount) {
    return [];
  }

  const roundedValuePerColumn = Math.floor(100 / columnCount);
  const widths = Array.from({ length: columnCount }, () => roundedValuePerColumn);

  let index = 0;
  let rest = 100 - (columnCount * roundedValuePerColumn);
  while (rest > 0) {
    widths[index] += 1;
    rest -= 1;
    index = (index + 1) % columnCount;
  }

  return widths;
}

export function createEmptyCell(rowIndex, columnIndex) {
  return {
    rowIndex,
    columnIndex,
    rowSpan: 1,
    columnSpan: 1,
    cellType: CELL_TYPE.body,
    text: '',
    verticalAlignment: VERTICAL_ALIGNMENT.top,
    horizontalAlignment: HORIZONTAL_ALIGNMENT.left
  };
}

export function visitAllCells(rowCount, columnCount, visitorCallback) {
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      visitorCallback(rowIndex, columnIndex);
    }
  }
}

export function createTableCellsFlat(rowCount, columnCount, createCell) {
  const cells = Array.from({ length: rowCount * columnCount });
  visitAllCells(rowCount, columnCount, (rowIndex, columnIndex) => {
    cells[(rowIndex * columnCount) + columnIndex] = createCell(rowIndex, columnIndex);
  });
  return cells;
}

export function createTableCellsInRows(rowCount, columnCount, createCell) {
  const rows = Array.from({ length: rowCount }, () => Array.from({ length: columnCount }));
  visitAllCells(rowCount, columnCount, (rowIndex, columnIndex) => {
    rows[rowIndex][columnIndex] = createCell(rowIndex, columnIndex);
  });
  return rows;
}

export function createTableDesignerCells(tableModel) {
  const { rowCount, columnCount, cells } = tableModel;
  const designerCells = [];

  designerCells.push({
    designerCellType: DESIGNER_CELL_TYPE.tableHeader,
    columnIndex: -1,
    rowIndex: -1
  });

  for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
    designerCells.push({
      designerCellType: DESIGNER_CELL_TYPE.columnHeader,
      rowIndex: -1,
      columnIndex
    });
  }

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    designerCells.push({
      designerCellType: DESIGNER_CELL_TYPE.rowHeader,
      rowIndex,
      columnIndex: -1
    });
  }

  for (const cell of cells) {
    designerCells.push({
      designerCellType: DESIGNER_CELL_TYPE.content,
      isFirstInRow: cell.columnIndex === 0,
      isLastInRow: cell.columnIndex + cell.columnSpan === columnCount,
      isFirstInColumn: cell.rowIndex === 0,
      isLastInColumn: cell.rowIndex + cell.rowSpan === rowCount,
      isConnected: cell.rowSpan > 1 || cell.columnSpan > 1,
      ...cell
    });
  }

  return designerCells;
}

function changeCellProps(tableModel, rowIndex, columnIndex, changedCellProps) {
  return {
    ...tableModel,
    cells: tableModel.cells.map(cell => {
      return isCellAffected(cell, rowIndex, columnIndex)
        ? { ...cell, ...changedCellProps }
        : cell;
    })
  };
}

export function changeCellText(tableModel, rowIndex, columnIndex, newText) {
  return changeCellProps(tableModel, rowIndex, columnIndex, { text: newText });
}

export function changeCellType(tableModel, rowIndex, columnIndex, newCellType) {
  return changeCellProps(tableModel, rowIndex, columnIndex, { cellType: newCellType });
}

export function changeVerticalAlignment(tableModel, rowIndex, columnIndex, newVerticalAlignment) {
  return changeCellProps(tableModel, rowIndex, columnIndex, { verticalAlignment: newVerticalAlignment });
}

export function changeHorizontalAlignment(tableModel, rowIndex, columnIndex, newHorizontalAlignment) {
  return changeCellProps(tableModel, rowIndex, columnIndex, { horizontalAlignment: newHorizontalAlignment });
}

function getMatrixDimensions(matrix) {
  return {
    rowCount: matrix.length,
    columnCount: matrix[0]?.length || 0
  };
}

function areMatrixCellsIdentical(cellA, cellB) {
  return cellA === cellB;
}

function countCellsInMatrixHorizontally(matrix, rowIndex, columnIndex, predicate, startValue = 0) {
  const { columnCount } = getMatrixDimensions(matrix);

  return columnIndex < columnCount && predicate(matrix[rowIndex][columnIndex])
    ? countCellsInMatrixHorizontally(matrix, rowIndex, columnIndex + 1, predicate, startValue + 1)
    : startValue;
}

function countCellsInMatrixVertically(matrix, rowIndex, columnIndex, predicate, startValue = 0) {
  const { rowCount } = getMatrixDimensions(matrix);

  return rowIndex < rowCount && predicate(matrix[rowIndex][columnIndex])
    ? countCellsInMatrixVertically(matrix, rowIndex + 1, columnIndex, predicate, startValue + 1)
    : startValue;
}

function getHorizontalNeighborsInMatrix(matrix, rowIndex, columnIndex) {
  const { columnCount } = getMatrixDimensions(matrix);
  const neighbors = [];
  if (columnIndex > 0) {
    neighbors.push(matrix[rowIndex][columnIndex - 1]);
  }
  if (columnIndex < columnCount - 1) {
    neighbors.push(matrix[rowIndex][columnIndex + 1]);
  }
  return neighbors;
}

function getVerticalNeighborsInMatrix(matrix, rowIndex, columnIndex) {
  const { rowCount } = getMatrixDimensions(matrix);
  const neighbors = [];
  if (rowIndex > 0) {
    neighbors.push(matrix[rowIndex - 1][columnIndex]);
  }
  if (rowIndex < rowCount - 1) {
    neighbors.push(matrix[rowIndex + 1][columnIndex]);
  }
  return neighbors;
}

function tableModelToMatrix(tableModel, ignoreEmptySlots) {
  const { rowCount, columnCount, cells } = tableModel;

  // 1. Create the matrix and fill each cell with `null`
  const matrix = createTableCellsInRows(rowCount, columnCount, () => null);

  // 2. Occupy slots with existing cells while checking each cell for data consistency
  cells.forEach(cell => {
    for (let rowIndex = cell.rowIndex; rowIndex < cell.rowIndex + cell.rowSpan; rowIndex += 1) {
      for (let columnIndex = cell.columnIndex; columnIndex < cell.columnIndex + cell.columnSpan; columnIndex += 1) {
        if (rowIndex < 0 || rowIndex > rowCount - 1 || columnIndex < 0 || columnIndex > columnCount - 1) {
          throw new Error(`Index out of bounds: rowIndex=${rowIndex}, columnIndex=${columnIndex}`);
        }
        if (matrix[rowIndex][columnIndex] !== null) {
          throw new Error(`There cannot be two cells in the same slot: rowIndex=${rowIndex}, columnIndex=${columnIndex}`);
        }
        matrix[rowIndex][columnIndex] = cell;
      }
    }
  });

  // 3. Check if all slots are taken
  visitAllCells(rowCount, columnCount, (rowIndex, columnIndex) => {
    if (!matrix[rowIndex][columnIndex] && !ignoreEmptySlots) {
      throw new Error(`Cell is missing in slot: rowIndex=${rowIndex}, columnIndex=${columnIndex}`);
    }
  });

  return matrix;
}

function matrixToTableModel(matrix) {
  const { rowCount, columnCount } = getMatrixDimensions(matrix);
  const processedCells = new Set();
  const cells = [];

  // 1. Fill up empty slots in the matrix by new cells (or neighbors in case of combined cells)
  visitAllCells(rowCount, columnCount, (rowIndex, columnIndex) => {
    if (!matrix[rowIndex][columnIndex]) {
      const horizontalNeighbors = getHorizontalNeighborsInMatrix(matrix, rowIndex, columnIndex);
      const verticalNeighbors = getVerticalNeighborsInMatrix(matrix, rowIndex, columnIndex);
      if (horizontalNeighbors.length === 2 && areMatrixCellsIdentical(...horizontalNeighbors)) {
        matrix[rowIndex][columnIndex] = horizontalNeighbors[0];
      } else if (verticalNeighbors.length === 2 && areMatrixCellsIdentical(...verticalNeighbors)) {
        matrix[rowIndex][columnIndex] = verticalNeighbors[0];
      } else {
        matrix[rowIndex][columnIndex] = createEmptyCell(rowIndex, columnIndex);
      }
    }
  });

  // 2. Collect the cells ordered first by row then by column while adjusting row and column indices/spans
  visitAllCells(rowCount, columnCount, (rowIndex, columnIndex) => {
    const currentCell = matrix[rowIndex][columnIndex];
    if (!processedCells.has(currentCell)) {
      const rowSpan = countCellsInMatrixVertically(matrix, rowIndex, columnIndex, cell => areMatrixCellsIdentical(cell, currentCell));
      const columnSpan = countCellsInMatrixHorizontally(matrix, rowIndex, columnIndex, cell => areMatrixCellsIdentical(cell, currentCell));
      cells.push({ ...currentCell, rowIndex, columnIndex, rowSpan, columnSpan });
      processedCells.add(currentCell);
    }
  });

  // 3. Create table model from the collected data:
  return { rowCount, columnCount, cells };
}

function insertRowInMatrix(matrix, rowIndex) {
  const { columnCount } = getMatrixDimensions(matrix);
  const newRow = Array.from({ length: columnCount }, () => null);
  return insertItemAt(matrix, newRow, rowIndex);
}

function insertColumnInMatrix(matrix, columnIndex) {
  return matrix.map(row => insertItemAt(row, null, columnIndex));
}

function deleteRowInMatrix(matrix, rowIndex) {
  return removeItemAt(matrix, rowIndex);
}

function deleteColumnInMatrix(matrix, columnIndex) {
  return matrix.map(row => removeItemAt(row, columnIndex));
}

function modifyTableAsMatrix(tableModel, modifierFunction = matrix => matrix, ignoreEmptySlots = false) {
  let matrix = tableModelToMatrix(tableModel, ignoreEmptySlots);
  matrix = modifierFunction(matrix);
  const newTableModel = matrixToTableModel(matrix);

  return { ...tableModel, ...newTableModel };
}

export function insertRow(tableModel, rowIndex) {
  return modifyTableAsMatrix(tableModel, matrix => insertRowInMatrix(matrix, rowIndex));
}

export function insertRowBefore(tableModel, rowIndex) {
  return insertRow(tableModel, rowIndex);
}

export function insertRowAfter(tableModel, rowIndex) {
  return insertRow(tableModel, rowIndex + 1);
}

export function insertColumn(tableModel, columnIndex) {
  return modifyTableAsMatrix(tableModel, matrix => insertColumnInMatrix(matrix, columnIndex));
}

export function insertColumnBefore(tableModel, columnIndex) {
  return insertColumn(tableModel, columnIndex);
}

export function insertColumnAfter(tableModel, columnIndex) {
  return insertColumn(tableModel, columnIndex + 1);
}

export function deleteRow(tableModel, rowIndex) {
  return modifyTableAsMatrix(tableModel, matrix => deleteRowInMatrix(matrix, rowIndex));
}

export function deleteColumn(tableModel, columnIndex) {
  return modifyTableAsMatrix(tableModel, matrix => deleteColumnInMatrix(matrix, columnIndex));
}

function doAreasOverlap(area1, area2) {
  const isArea1OutsideOfArea2 = area1.toRowIndex < area2.fromRowIndex
    || area1.fromRowIndex > area2.toRowIndex
    || area1.fromColumnIndex > area2.toColumnIndex
    || area1.toColumnIndex < area2.fromColumnIndex;

  return !isArea1OutsideOfArea2;
}

function getCellAt(tableModel, rowIndex, columnIndex) {
  return tableModel.cells.find(cell => doAreasOverlap({
    fromRowIndex: cell.rowIndex,
    toRowIndex: cell.rowIndex + cell.rowSpan - 1,
    fromColumnIndex: cell.columnIndex,
    toColumnIndex: cell.columnIndex + cell.columnSpan - 1
  }, {
    fromRowIndex: rowIndex,
    toRowIndex: rowIndex,
    fromColumnIndex: columnIndex,
    toColumnIndex: columnIndex
  }));
}

function isCellInArea(cell, area) {
  return doAreasOverlap(area, {
    fromRowIndex: cell.rowIndex,
    toRowIndex: cell.rowIndex + cell.rowSpan - 1,
    fromColumnIndex: cell.columnIndex,
    toColumnIndex: cell.columnIndex + cell.columnSpan - 1
  });
}

function getNeededAreaForCells(cells) {
  return cells.reduce((area, cell) => ({
    fromRowIndex: Math.min(cell.rowIndex, area.fromRowIndex ?? cell.rowIndex),
    toRowIndex: Math.max(cell.rowIndex + cell.rowSpan - 1, area.toRowIndex ?? cell.rowIndex + cell.rowSpan - 1),
    fromColumnIndex: Math.min(cell.columnIndex, area.fromColumnIndex ?? cell.columnIndex),
    toColumnIndex: Math.max(cell.columnIndex + cell.columnSpan - 1, area.toColumnIndex ?? cell.columnIndex + cell.columnSpan - 1)
  }), {});
}

function createConnectedCell(cells, targetArea) {
  cells.sort(by(x => x.rowIndex).thenBy(x => x.columnIndex));
  const firstCell = cells[0];
  return {
    ...firstCell,
    rowIndex: targetArea.fromRowIndex,
    columnIndex: targetArea.fromColumnIndex,
    rowSpan: (targetArea.toRowIndex - targetArea.fromRowIndex) + 1,
    columnSpan: (targetArea.toColumnIndex - targetArea.fromColumnIndex) + 1,
    text: cells.map(cell => cell.text).filter(text => !!text.trim()).join('\n\n')
  };
}

export function connectCells(tableModel, area) {
  const cellsToConnect = new Set();
  const remainingCells = new Set(tableModel.cells);

  let actuallyNeededArea = area;
  let currentlyProcessedArea = {};
  while (!deepEqual(currentlyProcessedArea, actuallyNeededArea)) {
    for (const cell of [...remainingCells]) {
      if (isCellInArea(cell, actuallyNeededArea)) {
        remainingCells.delete(cell);
        cellsToConnect.add(cell);
      }
    }
    currentlyProcessedArea = actuallyNeededArea;
    actuallyNeededArea = getNeededAreaForCells([...cellsToConnect]);
  }

  const mergedCell = createConnectedCell([...cellsToConnect], actuallyNeededArea);

  return {
    ...tableModel,
    cells: [...remainingCells, mergedCell].sort(by(cell => cell.rowIndex).thenBy(cell => cell.columnIndex))
  };
}

export function connectToRowBefore(tableModel, rowIndex, columnIndex) {
  const startCell = getCellAt(tableModel, rowIndex, columnIndex);
  return modifyTableAsMatrix(connectCells(tableModel, {
    fromRowIndex: startCell.rowIndex - 1,
    toRowIndex: startCell.rowIndex + startCell.rowSpan - 1,
    fromColumnIndex: startCell.columnIndex,
    toColumnIndex: startCell.columnIndex
  }));
}

export function connectToRowAfter(tableModel, rowIndex, columnIndex) {
  const startCell = getCellAt(tableModel, rowIndex, columnIndex);
  return modifyTableAsMatrix(connectCells(tableModel, {
    fromRowIndex: startCell.rowIndex,
    toRowIndex: startCell.rowIndex + startCell.rowSpan,
    fromColumnIndex: startCell.columnIndex,
    toColumnIndex: startCell.columnIndex
  }));
}

export function connectToColumnBefore(tableModel, rowIndex, columnIndex) {
  const startCell = getCellAt(tableModel, rowIndex, columnIndex);
  return modifyTableAsMatrix(connectCells(tableModel, {
    fromRowIndex: startCell.rowIndex,
    toRowIndex: startCell.rowIndex,
    fromColumnIndex: startCell.columnIndex - 1,
    toColumnIndex: startCell.columnIndex + startCell.columnSpan - 1
  }));
}

export function connectToColumnAfter(tableModel, rowIndex, columnIndex) {
  const startCell = getCellAt(tableModel, rowIndex, columnIndex);
  return modifyTableAsMatrix(connectCells(tableModel, {
    fromRowIndex: startCell.rowIndex,
    toRowIndex: startCell.rowIndex,
    fromColumnIndex: startCell.columnIndex,
    toColumnIndex: startCell.columnIndex + startCell.columnSpan
  }));
}

export function disconnectCell(tableModel, rowIndex, columnIndex) {
  let newTableModel = tableModel;
  let shouldLookForMoreCombinedCells = true;

  while (shouldLookForMoreCombinedCells) {
    const startCell = newTableModel.cells.find(cell => (cell.rowSpan !== 1 || cell.columnSpan !== 1) && isCellAffected(cell, rowIndex, columnIndex));
    if (startCell) {
      const newStartCell = { ...startCell, rowSpan: 1, columnSpan: 1 };
      newTableModel = modifyTableAsMatrix({
        ...newTableModel,
        cells: newTableModel.cells.map(cell => cell === startCell ? newStartCell : cell)
      }, matrix => matrix, true);
    } else {
      shouldLookForMoreCombinedCells = false;
    }
  }

  return newTableModel;
}

const designerActionExecutors = {
  [DESIGNER_CELL_ACTION.convertAllToHeaderCells]: (t, c) => changeCellType(t, c.rowIndex, c.columnIndex, CELL_TYPE.header),
  [DESIGNER_CELL_ACTION.convertToHeaderRow]: (t, c) => changeCellType(t, c.rowIndex, c.columnIndex, CELL_TYPE.header),
  [DESIGNER_CELL_ACTION.convertToHeaderColumn]: (t, c) => changeCellType(t, c.rowIndex, c.columnIndex, CELL_TYPE.header),
  [DESIGNER_CELL_ACTION.convertToHeaderCell]: (t, c) => changeCellType(t, c.rowIndex, c.columnIndex, CELL_TYPE.header),
  [DESIGNER_CELL_ACTION.convertAllToBodyCells]: (t, c) => changeCellType(t, c.rowIndex, c.columnIndex, CELL_TYPE.body),
  [DESIGNER_CELL_ACTION.convertToBodyRow]: (t, c) => changeCellType(t, c.rowIndex, c.columnIndex, CELL_TYPE.body),
  [DESIGNER_CELL_ACTION.convertToBodyColumn]: (t, c) => changeCellType(t, c.rowIndex, c.columnIndex, CELL_TYPE.body),
  [DESIGNER_CELL_ACTION.convertToBodyCell]: (t, c) => changeCellType(t, c.rowIndex, c.columnIndex, CELL_TYPE.body),
  [DESIGNER_CELL_ACTION.insertRowBefore]: (t, c) => insertRowBefore(t, c.rowIndex),
  [DESIGNER_CELL_ACTION.insertRowAfter]: (t, c) => insertRowAfter(t, c.rowIndex),
  [DESIGNER_CELL_ACTION.deleteRow]: (t, c) => deleteRow(t, c.rowIndex),
  [DESIGNER_CELL_ACTION.insertColumnBefore]: (t, c) => insertColumnBefore(t, c.columnIndex),
  [DESIGNER_CELL_ACTION.insertColumnAfter]: (t, c) => insertColumnAfter(t, c.columnIndex),
  [DESIGNER_CELL_ACTION.deleteColumn]: (t, c) => deleteColumn(t, c.columnIndex),
  [DESIGNER_CELL_ACTION.connectToRowBefore]: (t, c) => connectToRowBefore(t, c.rowIndex, c.columnIndex),
  [DESIGNER_CELL_ACTION.connectToRowAfter]: (t, c) => connectToRowAfter(t, c.rowIndex, c.columnIndex),
  [DESIGNER_CELL_ACTION.connectToColumnBefore]: (t, c) => connectToColumnBefore(t, c.rowIndex, c.columnIndex),
  [DESIGNER_CELL_ACTION.connectToColumnAfter]: (t, c) => connectToColumnAfter(t, c.rowIndex, c.columnIndex),
  [DESIGNER_CELL_ACTION.disconnectAllCells]: (t, c) => disconnectCell(t, c.rowIndex, c.columnIndex),
  [DESIGNER_CELL_ACTION.disconnectCell]: (t, c) => disconnectCell(t, c.rowIndex, c.columnIndex),
  [DESIGNER_CELL_ACTION.setVerticalAlignmentToTop]: (t, c) => changeVerticalAlignment(t, c.rowIndex, c.columnIndex, VERTICAL_ALIGNMENT.top),
  [DESIGNER_CELL_ACTION.setVerticalAlignmentToMiddle]: (t, c) => changeVerticalAlignment(t, c.rowIndex, c.columnIndex, VERTICAL_ALIGNMENT.middle),
  [DESIGNER_CELL_ACTION.setVerticalAlignmentToBottom]: (t, c) => changeVerticalAlignment(t, c.rowIndex, c.columnIndex, VERTICAL_ALIGNMENT.bottom),
  [DESIGNER_CELL_ACTION.setHorizontalAlignmentToLeft]: (t, c) => changeHorizontalAlignment(t, c.rowIndex, c.columnIndex, HORIZONTAL_ALIGNMENT.left),
  [DESIGNER_CELL_ACTION.setHorizontalAlignmentToCenter]: (t, c) => changeHorizontalAlignment(t, c.rowIndex, c.columnIndex, HORIZONTAL_ALIGNMENT.center),
  [DESIGNER_CELL_ACTION.setHorizontalAlignmentToRight]: (t, c) => changeHorizontalAlignment(t, c.rowIndex, c.columnIndex, HORIZONTAL_ALIGNMENT.right)
};

export function executeDesignerAction(tableModel, designerCell, action) {
  const execute = designerActionExecutors[action];
  if (!execute) {
    throw new Error(`Invalid action: '${action}'`);
  }

  return execute(tableModel, designerCell);
}
