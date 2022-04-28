import React, { useMemo } from 'react';
import { mapCellsNested } from './table-utils.js';
import Markdown from '../../components/markdown.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

function TableDisplay({ content }) {
  const { rowCount, columnCount, cells, renderMedia } = content;

  const rows = useMemo(() => {
    const fullCellMap = mapCellsNested(rowCount, columnCount, () => null);
    cells.forEach(cell => {
      fullCellMap[cell.rowIndex][cell.columnIndex] = cell;
    });

    for (let rowIndex = 0; rowIndex < fullCellMap.length; rowIndex += 1) {
      const row = fullCellMap[rowIndex];
      fullCellMap[rowIndex] = row.filter(cell => cell);
    }

    return fullCellMap.filter(row => row.length);
  }, [rowCount, columnCount, cells]);

  return (
    <div className="TableDisplay">
      <table className="TableDisplay-table">
        <tbody>
          {rows.map(row => (
            <tr key={row.map(cell => cell.key).join()}>
              {row.map(cell => (
                <td key={cell.key} rowSpan={cell.rowSpan} colSpan={cell.columnSpan} className="TableDisplay-cell">
                  {cell.text ? <Markdown renderMedia={renderMedia}>{cell.text}</Markdown> : <span>&nbsp;</span>}
                </td>
              ))}
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
