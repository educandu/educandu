import by from 'thenby';
import deepEqual from 'fast-deep-equal';
import uniqueId from '../../utils/unique-id.js';
import { insertItemAt, removeItemAt } from '../../utils/array-utils.js';

export const DESIGNER_CELL_TYPE = {
  corner: 'corner',
  columnHeader: 'column-header',
  rowHeader: 'row-header',
  content: 'content'
};

export const DESIGNER_CELL_ACTION = {
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
  disconnectCell: 'disconnect-cell'
};

export function createEmptyCell(rowIndex, columnIndex) {
  return { key: uniqueId.create(), rowIndex, columnIndex, rowSpan: 1, columnSpan: 1, text: '' };
}

export function visitAllCells(rowCount, columnCount, visitorCallback) {
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      visitorCallback(rowIndex, columnIndex);
    }
  }
}

export function mapCellsFlat(rowCount, columnCount, mappingFunction) {
  const cells = Array.from({ length: rowCount * columnCount });
  visitAllCells(rowCount, columnCount, (rowIndex, columnIndex) => {
    cells[(rowIndex * columnCount) + columnIndex] = mappingFunction(rowIndex, columnIndex);
  });
  return cells;
}

export function mapCellsNested(rowCount, columnCount, mappingFunction) {
  const rows = Array.from({ length: rowCount }, () => Array.from({ length: columnCount }));
  visitAllCells(rowCount, columnCount, (rowIndex, columnIndex) => {
    rows[rowIndex][columnIndex] = mappingFunction(rowIndex, columnIndex);
  });
  return rows;
}

export function createDesignerRowModel(tableModel) {
  const { rowCount, columnCount, cells } = tableModel;
  const rows = [];

  const firstRow = [{ key: `${DESIGNER_CELL_TYPE.corner}`, cellType: DESIGNER_CELL_TYPE.corner, rowIndex: -1, columnIndex: -1 }];
  for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
    firstRow.push({ key: `${DESIGNER_CELL_TYPE.columnHeader}-${columnIndex}`, cellType: DESIGNER_CELL_TYPE.columnHeader, rowIndex: -1, columnIndex });
  }

  rows.push(firstRow);

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const currentRow = [{ key: `${DESIGNER_CELL_TYPE.rowHeader}-${rowIndex}`, cellType: DESIGNER_CELL_TYPE.rowHeader, rowIndex, columnIndex: -1 }];
    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      currentRow.push(null);
    }

    rows.push(currentRow);
  }

  for (const cell of cells) {
    rows[cell.rowIndex + 1][cell.columnIndex + 1] = {
      cellType: DESIGNER_CELL_TYPE.content,
      isFirstInRow: cell.columnIndex === 0,
      isLastInRow: cell.columnIndex + cell.columnSpan === columnCount,
      isFirstInColumn: cell.rowIndex === 0,
      isLastInColumn: cell.rowIndex + cell.rowSpan === rowCount,
      isConnected: cell.rowSpan > 1 || cell.columnSpan > 1,
      ...cell
    };
  }

  return rows.map(cellsInRow => cellsInRow.filter(x => x));
}

export function changeCellText(tableModel, rowIndex, columnIndex, newText) {
  return {
    ...tableModel,
    cells: tableModel.cells.map(cell => {
      if (cell.rowIndex === rowIndex && cell.columnIndex === columnIndex) {
        return {
          ...cell,
          text: newText
        };
      }

      return cell;
    })
  };
}

function consolidateTable(tableModel) {
  const { rowCount, columnCount } = tableModel;

  // 1. Create the matrix and fill each cell with `null`
  const cellMap = mapCellsNested(rowCount, columnCount, () => null);

  // 2. Occupy slots with existing cells while checking each cell for data consistency
  tableModel.cells.forEach(cell => {
    for (let rowIndex = cell.rowIndex; rowIndex < cell.rowIndex + cell.rowSpan; rowIndex += 1) {
      for (let columnIndex = cell.columnIndex; columnIndex < cell.columnIndex + cell.columnSpan; columnIndex += 1) {
        if (rowIndex < 0 || rowIndex > rowCount - 1 || columnIndex < 0 || columnIndex > columnCount - 1) {
          throw new Error(`Index out of bounds: rowIndex=${rowIndex}, columnIndex=${columnIndex}`);
        }
        if (cellMap[rowIndex][columnIndex] !== null) {
          throw new Error(`There cannot be two cells in the same slot: rowIndex=${rowIndex}, columnIndex=${columnIndex}`);
        }
        cellMap[rowIndex][columnIndex] = cell;
      }
    }
  });

  // 3. Collect the cells ordered first by row then by column while filling up empty slots with new cells
  const cells = [];
  visitAllCells(rowCount, columnCount, (rowIndex, columnIndex) => {
    let currentCell = cellMap[rowIndex][columnIndex];
    if (!currentCell) {
      currentCell = createEmptyCell(rowIndex, columnIndex);
    }
    if (currentCell.rowIndex === rowIndex && currentCell.columnIndex === columnIndex) {
      cells.push(currentCell);
    }
  });

  return { ...tableModel, cells };
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

function tableModelToMatrix(tableModel) {
  const { rowCount, columnCount, cells } = tableModel;

  // 1. Create the matrix and fill each cell with `null`
  const matrix = mapCellsNested(rowCount, columnCount, () => null);

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
    if (!matrix[rowIndex][columnIndex]) {
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

// Inserts a row into the matrix at index `rowIndex` filling it up with `null`
function insertRowInMatrix(matrix, rowIndex) {
  const { columnCount } = getMatrixDimensions(matrix);
  const newRow = Array.from({ length: columnCount }, () => null);
  return insertItemAt(matrix, newRow, rowIndex);
}

// Inserts a column into the matrix at index `columnIndex` filling it up with `null`
function insertColumnInMatrix(matrix, columnIndex) {
  return matrix.map(row => insertItemAt(row, null, columnIndex));
}

// Deletes a row into the matrix at index `rowIndex`
function deleteRowInMatrix(matrix, rowIndex) {
  return removeItemAt(matrix, rowIndex);
}

// Deletes a column into the matrix at index `columnIndex`
function deleteColumnInMatrix(matrix, columnIndex) {
  return matrix.map(row => removeItemAt(row, columnIndex));
}

function modifyTableAsMatrix(tableModel, modifierFunction) {
  let matrix = tableModelToMatrix(tableModel);
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

function createMergedCell(cells, targetArea) {
  cells.sort(by(x => x.rowIndex).thenBy(x => x.columnIndex));
  const firstCell = cells[0];
  return {
    ...firstCell,
    key: uniqueId.create(),
    rowIndex: targetArea.fromRowIndex,
    columnIndex: targetArea.fromColumnIndex,
    rowSpan: (targetArea.toRowIndex - targetArea.fromRowIndex) + 1,
    columnSpan: (targetArea.toColumnIndex - targetArea.fromColumnIndex) + 1,
    text: cells.map(cell => cell.text).filter(text => !!text.trim()).join('\n\n')
  };
}

export function connectCells(tableModel, area) {
  const cellsToMerge = new Set();
  const remainingCells = new Set(tableModel.cells);

  let actuallyNeededArea = area;
  let currentlyProcessedArea = {};
  while (!deepEqual(currentlyProcessedArea, actuallyNeededArea)) {
    for (const cell of [...remainingCells]) {
      if (isCellInArea(cell, actuallyNeededArea)) {
        remainingCells.delete(cell);
        cellsToMerge.add(cell);
      }
    }
    currentlyProcessedArea = actuallyNeededArea;
    actuallyNeededArea = getNeededAreaForCells([...cellsToMerge]);
  }

  const mergedCell = createMergedCell([...cellsToMerge], actuallyNeededArea);

  return {
    ...tableModel,
    cells: [...remainingCells, mergedCell].sort(by(cell => cell.rowIndex).thenBy(cell => cell.columnIndex))
  };
}

export function connectToRowBefore(tableModel, rowIndex, columnIndex) {
  const startCell = getCellAt(tableModel, rowIndex, columnIndex);
  return consolidateTable(connectCells(tableModel, {
    fromRowIndex: startCell.rowIndex - 1,
    toRowIndex: startCell.rowIndex + startCell.rowSpan - 1,
    fromColumnIndex: startCell.columnIndex,
    toColumnIndex: startCell.columnIndex
  }));
}

export function connectToRowAfter(tableModel, rowIndex, columnIndex) {
  const startCell = getCellAt(tableModel, rowIndex, columnIndex);
  return consolidateTable(connectCells(tableModel, {
    fromRowIndex: startCell.rowIndex,
    toRowIndex: startCell.rowIndex + startCell.rowSpan,
    fromColumnIndex: startCell.columnIndex,
    toColumnIndex: startCell.columnIndex
  }));
}

export function connectToColumnBefore(tableModel, rowIndex, columnIndex) {
  const startCell = getCellAt(tableModel, rowIndex, columnIndex);
  return consolidateTable(connectCells(tableModel, {
    fromRowIndex: startCell.rowIndex,
    toRowIndex: startCell.rowIndex,
    fromColumnIndex: startCell.columnIndex - 1,
    toColumnIndex: startCell.columnIndex + startCell.columnSpan - 1
  }));
}

export function connectToColumnAfter(tableModel, rowIndex, columnIndex) {
  const startCell = getCellAt(tableModel, rowIndex, columnIndex);
  return consolidateTable(connectCells(tableModel, {
    fromRowIndex: startCell.rowIndex,
    toRowIndex: startCell.rowIndex,
    fromColumnIndex: startCell.columnIndex,
    toColumnIndex: startCell.columnIndex + startCell.columnSpan
  }));
}
