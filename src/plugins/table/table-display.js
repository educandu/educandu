import classNames from 'classnames';
import React, { useMemo } from 'react';
import Markdown from '../../components/markdown.js';
import { HORIZONTAL_ALIGNMENT, VERTICAL_ALIGNMENT } from '../../domain/constants.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import { calculateEvenColumnWidthsInPercent, CELL_TYPE, COLUMN_DISTRIBUTION, createTableCellsInRows } from './table-utils.js';

function TableDisplay({ content }) {
  const { rowCount, columnCount, cells, columnDistribution, width } = content;

  const rows = useMemo(() => {
    const fullCellMap = createTableCellsInRows(rowCount, columnCount, () => null);
    cells.forEach(cell => {
      fullCellMap[cell.rowIndex][cell.columnIndex] = cell;
    });

    for (let rowIndex = 0; rowIndex < fullCellMap.length; rowIndex += 1) {
      const row = fullCellMap[rowIndex];
      fullCellMap[rowIndex] = row.filter(cell => cell);
    }

    return fullCellMap.filter(row => row.length);
  }, [rowCount, columnCount, cells]);

  const columnWidths = useMemo(() => {
    switch (columnDistribution) {
      case COLUMN_DISTRIBUTION.even:
        return calculateEvenColumnWidthsInPercent(columnCount);
      default:
        return null;
    }
  }, [columnCount, columnDistribution]);

  const renderCell = cell => {
    const props = {
      key: `${cell.rowIndex}|${cell.columnIndex}`,
      rowSpan: cell.rowSpan,
      colSpan: cell.columnSpan,
      className: classNames({
        'TableDisplay-cell': true,
        'TableDisplay-cell--header': cell.cellType === CELL_TYPE.header,
        'TableDisplay-cell--body': cell.cellType === CELL_TYPE.body,
        'TableDisplay-cell--verticalAlignmentTop': cell.verticalAlignment === VERTICAL_ALIGNMENT.top,
        'TableDisplay-cell--verticalAlignmentMiddle': cell.verticalAlignment === VERTICAL_ALIGNMENT.middle,
        'TableDisplay-cell--verticalAlignmentBottom': cell.verticalAlignment === VERTICAL_ALIGNMENT.bottom,
        'TableDisplay-cell--horizontalAlignmentLeft': cell.horizontalAlignment === HORIZONTAL_ALIGNMENT.left,
        'TableDisplay-cell--horizontalAlignmentCenter': cell.horizontalAlignment === HORIZONTAL_ALIGNMENT.center,
        'TableDisplay-cell--horizontalAlignmentRight': cell.horizontalAlignment === HORIZONTAL_ALIGNMENT.right
      })
    };

    const children = cell.text
      ? <Markdown>{cell.text}</Markdown>
      : <span>&nbsp;</span>;

    switch (cell.cellType) {
      case CELL_TYPE.header:
        return <th {...props}>{children}</th>;
      case CELL_TYPE.body:
        return <td {...props}>{children}</td>;
      default:
        throw new Error(`Invalid cell type: ${cell.cellType}`);
    }
  };

  return (
    <div className="TableDisplay">
      <table className={`TableDisplay-table u-width-${width || 100}`}>
        {columnWidths && columnWidths.map((value, index) => (
          <colgroup key={index.toString()} width={`${value}%`} />
        ))}
        <tbody>
          {rows.map((row, index) => (
            <tr key={index.toString()}>
              {row.map(renderCell)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

TableDisplay.propTypes = {
  ...sectionDisplayProps
};

export default TableDisplay;
