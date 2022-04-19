import React from 'react';
import Markdown from '../../components/markdown.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

const createCellMapKey = (rowIndex, columnIndex) => `${rowIndex}-${columnIndex}`;

function TableDisplay({ content }) {
  const { rowCount, columnCount, cells, renderMedia } = content;

  const cellMap = cells.reduce((map, cell) => {
    map.set(`${cell.startRow}-${cell.startColumn}`, cell);
    return map;
  }, new Map());

  const renderCell = (rowIndex, columnIndex) => {
    const cell = cellMap.get(createCellMapKey(rowIndex, columnIndex));
    if (!cell) {
      return null;
    }

    return (
      <td key={columnIndex} className="TableDisplay-cell">
        {cell.text ? <Markdown renderMedia={renderMedia}>{cell.text}</Markdown> : <span>&nbsp;</span>}
      </td>
    );
  };

  return (
    <div className="TableDisplay">
      <table className="TableDisplay-table">
        <tbody>
          {[...new Array(rowCount).keys()].map(rowIndex => (
            <tr key={rowIndex}>
              {[...new Array(columnCount).keys()].map(columnIndex => renderCell(rowIndex, columnIndex))}
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
