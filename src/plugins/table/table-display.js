import React, { useMemo } from 'react';
import Markdown from '../../components/markdown.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import { calculateEvenColumnWidthsInPercent, CELL_TYPE, COLUMN_DISTRIBUTION, createTableCellsInRows } from './table-utils.js';

function TableDisplay({ content }) {
  const { rowCount, columnCount, cells, columnDistribution, width, renderMedia } = content;

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
      key: cell.key,
      rowSpan: cell.rowSpan,
      colSpan: cell.columnSpan,
      className: `TableDisplay-cell TableDisplay-cell--${cell.cellType}`
    };

    const children = cell.text
      ? <Markdown renderMedia={renderMedia}>{cell.text}</Markdown>
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
          {rows.map(row => (
            <tr key={row.map(cell => cell.key).join()}>
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
