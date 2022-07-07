import PropTypes from 'prop-types';
import classNames from 'classnames';
import React, { useMemo, useState } from 'react';
import TableDesignerMenu from './table-designer-menu.js';
import MarkdownInput from '../../components/markdown-input.js';
import DebouncedInput from '../../components/debounced-input.js';
import {
  changeCellText,
  changeCellTypesInRow,
  changeCellTypesInColumn,
  changeCellType,
  createTableDesignerCells,
  deleteColumn,
  deleteRow,
  DESIGNER_CELL_ACTION,
  DESIGNER_CELL_TYPE,
  insertColumnAfter,
  insertColumnBefore,
  insertRowAfter,
  insertRowBefore,
  connectToColumnAfter,
  connectToColumnBefore,
  connectToRowAfter,
  connectToRowBefore,
  disconnectCell,
  CELL_TYPE
} from './table-utils.js';

const CONTENT_INPUT_DATA_ROLE = 'content-input';

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
    case DESIGNER_CELL_TYPE.content:
      return [designerCell.rowIndex, designerCell.columnIndex, designerCell.rowSpan, designerCell.columnSpan, designerCell.cellType].join('|');
    case DESIGNER_CELL_TYPE.rowHeader:
      return `${DESIGNER_CELL_TYPE.rowHeader}-${designerCell.rowIndex}`;
    case DESIGNER_CELL_TYPE.columnHeader:
      return `${DESIGNER_CELL_TYPE.columnHeader}-${designerCell.columnIndex}`;
    default:
      throw new Error(`Invalid designer cell type ${designerCell.designerCellType}`);
  }
};

function TableDesigner({ content, onContentChange }) {
  const { rowCount, columnCount } = content;
  const [activeRowIndex, setActiveRowIndex] = useState(-1);
  const [activeColumnIndex, setActiveColumnIndex] = useState(-1);

  const designerCells = useMemo(() => {
    return createTableDesignerCells(content);
  }, [content]);

  const handleDesignerCellTextChange = (cell, newText) => {
    onContentChange(changeCellText(content, cell.rowIndex, cell.columnIndex, newText));
  };

  const handleDesignerCellAction = (action, designerCell) => {
    switch (action) {
      case DESIGNER_CELL_ACTION.convertToHeaderRow:
        onContentChange(changeCellTypesInRow(content, designerCell.rowIndex, CELL_TYPE.header));
        break;
      case DESIGNER_CELL_ACTION.convertToBodyRow:
        onContentChange(changeCellTypesInRow(content, designerCell.rowIndex, CELL_TYPE.body));
        break;
      case DESIGNER_CELL_ACTION.convertToHeaderColumn:
        onContentChange(changeCellTypesInColumn(content, designerCell.columnIndex, CELL_TYPE.header));
        break;
      case DESIGNER_CELL_ACTION.convertToBodyColumn:
        onContentChange(changeCellTypesInColumn(content, designerCell.columnIndex, CELL_TYPE.body));
        break;
      case DESIGNER_CELL_ACTION.convertToHeaderCell:
        onContentChange(changeCellType(content, designerCell.rowIndex, designerCell.columnIndex, CELL_TYPE.header));
        break;
      case DESIGNER_CELL_ACTION.convertToBodyCell:
        onContentChange(changeCellType(content, designerCell.rowIndex, designerCell.columnIndex, CELL_TYPE.body));
        break;
      case DESIGNER_CELL_ACTION.insertRowBefore:
        onContentChange(insertRowBefore(content, designerCell.rowIndex));
        break;
      case DESIGNER_CELL_ACTION.insertRowAfter:
        onContentChange(insertRowAfter(content, designerCell.rowIndex));
        break;
      case DESIGNER_CELL_ACTION.deleteRow:
        onContentChange(deleteRow(content, designerCell.rowIndex));
        break;
      case DESIGNER_CELL_ACTION.insertColumnBefore:
        onContentChange(insertColumnBefore(content, designerCell.columnIndex));
        break;
      case DESIGNER_CELL_ACTION.insertColumnAfter:
        onContentChange(insertColumnAfter(content, designerCell.columnIndex));
        break;
      case DESIGNER_CELL_ACTION.deleteColumn:
        onContentChange(deleteColumn(content, designerCell.columnIndex));
        break;
      case DESIGNER_CELL_ACTION.connectToRowBefore:
        onContentChange(connectToRowBefore(content, designerCell.rowIndex, designerCell.columnIndex));
        break;
      case DESIGNER_CELL_ACTION.connectToRowAfter:
        onContentChange(connectToRowAfter(content, designerCell.rowIndex, designerCell.columnIndex));
        break;
      case DESIGNER_CELL_ACTION.connectToColumnBefore:
        onContentChange(connectToColumnBefore(content, designerCell.rowIndex, designerCell.columnIndex));
        break;
      case DESIGNER_CELL_ACTION.connectToColumnAfter:
        onContentChange(connectToColumnAfter(content, designerCell.rowIndex, designerCell.columnIndex));
        break;
      case DESIGNER_CELL_ACTION.disconnectCell:
        onContentChange(disconnectCell(content, designerCell.rowIndex, designerCell.columnIndex));
        break;
      default:
        throw new Error(`Invalid action: '${action}'`);
    }
  };

  const handleContentCellClick = event => {
    if (event.target === event.currentTarget) {
      const textarea = event.target.querySelector(`[data-role="${CONTENT_INPUT_DATA_ROLE}"]`);
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      }
    }
  };

  const handleActiveRowChange = (rowIndex, isActive) => {
    setActiveRowIndex(currentValue => {
      if (!isActive && rowIndex === currentValue) {
        return -1;
      }
      return isActive ? rowIndex : currentValue;
    });
  };

  const handleActiveColumnChange = (columnIndex, isActive) => {
    setActiveColumnIndex(currentValue => {
      if (!isActive && columnIndex === currentValue) {
        return -1;
      }
      return isActive ? columnIndex : currentValue;
    });
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
            onIsActiveChange={isActive => handleActiveRowChange(designerCell.rowIndex, isActive)}
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
            onIsActiveChange={isActive => handleActiveColumnChange(designerCell.columnIndex, isActive)}
            />
        </div>
      </div>
    );
  };

  const renderContentGridCell = designerCell => {
    const isInActiveRow = designerCell.rowIndex <= activeRowIndex && designerCell.rowIndex + designerCell.rowSpan - 1 >= activeRowIndex;
    const isInActiveColumn = designerCell.columnIndex <= activeColumnIndex && designerCell.columnIndex + designerCell.columnSpan - 1 >= activeColumnIndex;

    const classes = classNames({
      'is-active': isInActiveRow || isInActiveColumn,
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
        onClick={handleContentCellClick}
        >
        <DebouncedInput
          elementType={MarkdownInput}
          data-role={CONTENT_INPUT_DATA_ROLE}
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
            />
        </div>
      </div>
    );
  };

  const renderDesignerGridCell = designerCell => {
    switch (designerCell.designerCellType) {
      case DESIGNER_CELL_TYPE.content:
        return renderContentGridCell(designerCell);
      case DESIGNER_CELL_TYPE.rowHeader:
        return renderRowHeaderGridCell(designerCell);
      case DESIGNER_CELL_TYPE.columnHeader:
        return renderColumnHeaderGridCell(designerCell);
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
