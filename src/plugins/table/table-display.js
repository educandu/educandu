import React, { useMemo } from 'react';
import Markdown from '../../components/markdown.js';
import { mapTwoDimensionalArray } from './table-utils.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

function TableDisplay({ content }) {
  const { rowCount, columnCount, cells, renderMedia } = content;

  const rows = useMemo(() => {
    const fullCellMap = mapTwoDimensionalArray(rowCount, columnCount, () => null);
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
                <td key={cell.key} className="TableDisplay-cell">
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
