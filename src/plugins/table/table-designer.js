import PropTypes from 'prop-types';
import classNames from 'classnames';
import React, { useMemo, useState } from 'react';
import TableDesignerMenu from './table-designer-menu.js';
import MarkdownInput from '../../components/markdown-input.js';
import DebouncedInput from '../../components/debounced-input.js';
import { changeCellText, createTableDesignerCells, DESIGNER_CELL_TYPE, isCellAffected, CELL_TYPE, executeDesignerAction } from './table-utils.js';

const HEADER_SIZE = '20px';

const getDesignerGridStyle = (rowCount, columnCount) => {
  return {
    gridTemplateRows: `${HEADER_SIZE} repeat(${rowCount}, auto)`,
    gridTemplateColumns: `${HEADER_SIZE} repeat(${columnCount}, 1fr)`
  };
};

const getDesignerCellStyle = designerCell => {
  return {
    gridRowStart: designerCell.rowIndex + 2,
    gridRowEnd: designerCell.rowIndex + 2 + (designerCell.rowSpan || 1),
    gridColumnStart: designerCell.columnIndex + 2,
    gridColumnEnd: designerCell.columnIndex + 2 + (designerCell.columnSpan || 1)
  };
};

const getDesignerCellKey = designerCell => {
  switch (designerCell.designerCellType) {
    case DESIGNER_CELL_TYPE.tableHeader:
      return DESIGNER_CELL_TYPE.tableHeader;
    case DESIGNER_CELL_TYPE.columnHeader:
      return `${DESIGNER_CELL_TYPE.columnHeader}-${designerCell.columnIndex}`;
    case DESIGNER_CELL_TYPE.rowHeader:
      return `${DESIGNER_CELL_TYPE.rowHeader}-${designerCell.rowIndex}`;
    case DESIGNER_CELL_TYPE.content:
      return [designerCell.rowIndex, designerCell.columnIndex, designerCell.rowSpan, designerCell.columnSpan, designerCell.cellType].join('|');
    default:
      throw new Error(`Invalid designer cell type ${designerCell.designerCellType}`);
  }
};

function TableDesigner({ content, onContentChange }) {
  const { rowCount, columnCount } = content;
  const [activeDesignerCellMenu, setActiveDesignerCellMenu] = useState(null);

  const designerCells = useMemo(() => {
    return createTableDesignerCells(content);
  }, [content]);

  const handleDesignerCellTextChange = (cell, newText) => {
    onContentChange(changeCellText(content, cell.rowIndex, cell.columnIndex, newText));
  };

  const handleDesignerCellAction = (action, designerCell) => {
    onContentChange(executeDesignerAction(content, designerCell, action));
  };

  const handleDesignerCellIsActiveChange = (isActive, designerCell) => {
    setActiveDesignerCellMenu(currentValue => {
      if (!isActive && currentValue?.rowIndex === designerCell.rowIndex && currentValue?.columnIndex === designerCell.columnIndex) {
        return null;
      }

      return isActive ? { rowIndex: designerCell.rowIndex, columnIndex: designerCell.columnIndex } : currentValue;
    });
  };

  const renderTableHeaderGridCell = designerCell => {
    return (
      <div
        key={getDesignerCellKey(designerCell)}
        style={getDesignerCellStyle(designerCell)}
        className="TableDesigner-gridCell TableDesigner-gridCell--tableHeader"
        >
        <div className="TableDesigner-headerCellMenuContainer">
          <TableDesignerMenu
            canDeleteRow={rowCount > 1}
            canDeleteColumn={columnCount > 1}
            cell={designerCell}
            onCellAction={handleDesignerCellAction}
            onIsActiveChange={handleDesignerCellIsActiveChange}
            />
        </div>
      </div>
    );
  };

  const renderRowHeaderGridCell = designerCell => {
    return (
      <div
        key={getDesignerCellKey(designerCell)}
        style={getDesignerCellStyle(designerCell)}
        className="TableDesigner-gridCell TableDesigner-gridCell--rowHeader"
        >
        <div className="TableDesigner-headerCellMenuContainer">
          <TableDesignerMenu
            canDeleteRow={rowCount > 1}
            canDeleteColumn={columnCount > 1}
            cell={designerCell}
            onCellAction={handleDesignerCellAction}
            onIsActiveChange={handleDesignerCellIsActiveChange}
            />
        </div>
      </div>
    );
  };

  const renderColumnHeaderGridCell = designerCell => {
    return (
      <div
        key={getDesignerCellKey(designerCell)}
        style={getDesignerCellStyle(designerCell)}
        className="TableDesigner-gridCell TableDesigner-gridCell--columnHeader"
        >
        <div className="TableDesigner-headerCellMenuContainer">
          <TableDesignerMenu
            canDeleteRow={rowCount > 1}
            canDeleteColumn={columnCount > 1}
            cell={designerCell}
            onCellAction={handleDesignerCellAction}
            onIsActiveChange={handleDesignerCellIsActiveChange}
            />
        </div>
      </div>
    );
  };

  const renderContentGridCell = designerCell => {
    const isCellActive = activeDesignerCellMenu && isCellAffected(designerCell, activeDesignerCellMenu.rowIndex, activeDesignerCellMenu.columnIndex);

    const classes = classNames({
      'is-active': isCellActive,
      'TableDesigner-gridCell': true,
      'TableDesigner-gridCell--content': true,
      'TableDesigner-gridCell--firstInRow': designerCell.isFirstInRow,
      'TableDesigner-gridCell--firstInColumn': designerCell.isFirstInColumn,
      'TableDesigner-gridCell--cellTypeHeader': designerCell.cellType === CELL_TYPE.header,
      'TableDesigner-gridCell--cellTypeBody': designerCell.cellType === CELL_TYPE.body
    });

    return (
      <div
        key={getDesignerCellKey(designerCell)}
        className={classes}
        style={getDesignerCellStyle(designerCell)}
        >
        <DebouncedInput
          elementType={MarkdownInput}
          verticalAlignment={designerCell.verticalAlignment}
          horizontalAlignment={designerCell.horizontalAlignment}
          value={designerCell.text}
          onChange={newText => handleDesignerCellTextChange(designerCell, newText)}
          renderMedia={content.renderMedia}
          minRows={1}
          embeddable
          />
        <div className="TableDesigner-contentCellMenuContainer">
          <TableDesignerMenu
            canDeleteRow={!designerCell.isConnected && !(designerCell.isFirstInColumn && designerCell.isLastInColumn)}
            canDeleteColumn={!designerCell.isConnected && !(designerCell.isFirstInRow && designerCell.isLastInRow)}
            cell={designerCell}
            dotType="zooming"
            onCellAction={handleDesignerCellAction}
            onIsActiveChange={handleDesignerCellIsActiveChange}
            />
        </div>
      </div>
    );
  };

  const renderDesignerGridCell = designerCell => {
    switch (designerCell.designerCellType) {
      case DESIGNER_CELL_TYPE.tableHeader:
        return renderTableHeaderGridCell(designerCell);
      case DESIGNER_CELL_TYPE.columnHeader:
        return renderColumnHeaderGridCell(designerCell);
      case DESIGNER_CELL_TYPE.rowHeader:
        return renderRowHeaderGridCell(designerCell);
      case DESIGNER_CELL_TYPE.content:
        return renderContentGridCell(designerCell);
      default:
        throw new Error(`Invalid designer cell type ${designerCell.designerCellType}`);
    }
  };

  return (
    <div className="TableDesigner">
      <div
        className="TableDesigner-grid"
        style={getDesignerGridStyle(rowCount, columnCount)}
        >
        {designerCells.map(designerCell => renderDesignerGridCell(designerCell))}
      </div>
    </div>
  );
}

TableDesigner.propTypes = {
  content: PropTypes.shape({
    cells: PropTypes.arrayOf(PropTypes.shape({
      rowIndex: PropTypes.number.isRequired,
      columnIndex: PropTypes.number.isRequired,
      rowSpan: PropTypes.number.isRequired,
      columnSpan: PropTypes.number.isRequired,
      text: PropTypes.string.isRequired
    })).isRequired,
    columnCount: PropTypes.number.isRequired,
    rowCount: PropTypes.number.isRequired,
    renderMedia: PropTypes.bool.isRequired
  }).isRequired,
  onContentChange: PropTypes.func.isRequired
};

export default TableDesigner;
