import uniqueId from '../../utils/unique-id.js';

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
  deleteColumn: 'delete-column'
};

export function createDesignerRows({ rowCount, columnCount, cells }) {
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
      ...cell
    };
  }

  return rows;
}

export function changeText(originalValues, rowIndex, columnIndex, newText) {
  return {
    ...originalValues,
    cells: originalValues.cells.map(cell => {
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

export function createEmptyCell(rowIndex, columnIndex) {
  return { key: uniqueId.create(), rowIndex, columnIndex, rowSpan: 1, columnSpan: 1, text: '' };
}

function visitAllCells(rowCount, columnCount, visitorCallback) {
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      visitorCallback(rowIndex, columnIndex);
    }
  }
}

export function mapFlatArray(rowCount, columnCount, mappingFunction) {
  const cells = new Array(rowCount * columnCount);
  visitAllCells(rowCount, columnCount, (rowIndex, columnIndex) => {
    cells[(rowIndex * columnCount) + columnIndex] = mappingFunction(rowIndex, columnIndex);
  });
  return cells;
}

export function mapTwoDimensionalArray(rowCount, columnCount, mappingFunction) {
  const rows = new Array(rowCount);
  visitAllCells(rowCount, columnCount, (rowIndex, columnIndex) => {
    if (!rows[rowIndex]) {
      rows[rowIndex] = new Array(columnCount);
    }
    rows[rowIndex][columnIndex] = mappingFunction(rowIndex, columnIndex);
  });
  return rows;
}

function consolidateTable({ rowCount, columnCount, cells }) {
  // 1. Create the matrix and fill each cell with `null`
  const cellMap = mapTwoDimensionalArray(rowCount, columnCount, () => null);

  // 2. Occupy slots with existing cells and check consistency
  cells.forEach(cell => {
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

  // 3. Collect the cells in order while filling up empty slots with new cells
  const newCells = [];
  visitAllCells(rowCount, columnCount, (rowIndex, columnIndex) => {
    let currentCell = cellMap[rowIndex][columnIndex];
    if (!currentCell) {
      currentCell = createEmptyCell(rowIndex, columnIndex);
    }
    if (currentCell.rowIndex === rowIndex && currentCell.columnIndex === columnIndex) {
      newCells.push(currentCell);
    }
  });

  return { rowCount, columnCount, cells: newCells };
}

function adjustCellsForRowInsertion(cells, rowIndex) {
  return cells.map(cell => ({
    ...cell,
    rowIndex: cell.rowIndex + (cell.rowIndex >= rowIndex ? 1 : 0),
    rowSpan: cell.rowSpan + (cell.rowIndex < rowIndex && (cell.rowIndex + cell.rowSpan > rowIndex) ? 1 : 0)
  }));
}

function adjustCellsForRowDeletion(cells, rowIndex) {
  return cells.reduce((result, cell) => {
    if (cell.rowIndex < rowIndex) {
      result.push({
        ...cell,
        rowSpan: cell.rowSpan - (cell.rowIndex + cell.rowSpan > rowIndex ? 1 : 0)
      });
    } else if (cell.rowIndex === rowIndex && cell.rowSpan > 1) {
      result.push({
        ...cell,
        rowIndex: cell.rowIndex + 1,
        rowSpan: cell.rowSpan - 1
      });
    } else if (cell.rowIndex > rowIndex) {
      result.push({
        ...cell,
        rowIndex: cell.rowIndex - 1
      });
    }

    return result;
  }, []);
}

function adjustCellsForColumnInsertion(cells, columnIndex) {
  return cells.map(cell => ({
    ...cell,
    columnIndex: cell.columnIndex + (cell.columnIndex >= columnIndex ? 1 : 0),
    columnSpan: cell.columnSpan + (cell.columnIndex < columnIndex && (cell.columnIndex + cell.columnSpan > columnIndex) ? 1 : 0)
  }));
}

function adjustCellsForColumnDeletion(cells, columnIndex) {
  return cells.reduce((result, cell) => {
    if (cell.columnIndex < columnIndex) {
      result.push({
        ...cell,
        columnSpan: cell.columnSpan - (cell.columnIndex + cell.columnSpan > columnIndex ? 1 : 0)
      });
    } else if (cell.columnIndex === columnIndex && cell.columnSpan > 1) {
      result.push({
        ...cell,
        columnIndex: cell.columnIndex + 1,
        columnSpan: cell.columnSpan - 1
      });
    } else if (cell.columnIndex > columnIndex) {
      result.push({
        ...cell,
        columnIndex: cell.columnIndex - 1
      });
    }

    return result;
  }, []);
}

export function insertRowBefore(originalValues, rowIndex) {
  return consolidateTable({
    ...originalValues,
    rowCount: originalValues.rowCount + 1,
    cells: adjustCellsForRowInsertion(originalValues.cells, rowIndex)
  });
}

export function insertRowAfter(originalValues, rowIndex) {
  return consolidateTable({
    ...originalValues,
    rowCount: originalValues.rowCount + 1,
    cells: adjustCellsForRowInsertion(originalValues.cells, rowIndex + 1)
  });
}

export function deleteRow(originalValues, rowIndex) {
  return consolidateTable({
    ...originalValues,
    rowCount: originalValues.rowCount - 1,
    cells: adjustCellsForRowDeletion(originalValues.cells, rowIndex)
  });
}

export function insertColumnBefore(originalValues, columnIndex) {
  return consolidateTable({
    ...originalValues,
    columnCount: originalValues.columnCount + 1,
    cells: adjustCellsForColumnInsertion(originalValues.cells, columnIndex)
  });
}

export function insertColumnAfter(originalValues, columnIndex) {
  return consolidateTable({
    ...originalValues,
    columnCount: originalValues.columnCount + 1,
    cells: adjustCellsForColumnInsertion(originalValues.cells, columnIndex + 1)
  });
}

export function deleteColumn(originalValues, columnIndex) {
  return consolidateTable({
    ...originalValues,
    columnCount: originalValues.columnCount - 1,
    cells: adjustCellsForColumnDeletion(originalValues.cells, columnIndex)
  });
}
