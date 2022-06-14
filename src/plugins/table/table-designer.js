import PropTypes from 'prop-types';
import classNames from 'classnames';
import TableDesignerMenu from './table-designer-menu.js';
import React, { Fragment, useMemo, useState } from 'react';
import MarkdownInput from '../../components/markdown-input.js';
import DebouncedInput from '../../components/debounced-input.js';
import {
  changeCellText,
  changeCellTypesInRow,
  changeCellTypesInColumn,
  changeCellType,
  createTableDesignerRows,
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
import MarkdownHelp from '../../components/markdown-help.js';

const CONTENT_INPUT_DATA_ROLE = 'content-input';

function TableDesigner({ content, onContentChange }) {
  const { rowCount, columnCount } = content;
  const [activeRowIndex, setActiveRowIndex] = useState(-1);
  const [activeColumnIndex, setActiveColumnIndex] = useState(-1);

  const designerRows = useMemo(() => {
    return createTableDesignerRows(content);
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

  const renderRowHeaderCell = designerCell => {
    return (
      <td
        className="TableDesigner-tableCell TableDesigner-tableCell--rowHeader"
        key={designerCell.key}
        >
        <div className="TableDesigner-headerCellMenuContainer">
          <TableDesignerMenu
            canDeleteRow={rowCount > 1}
            canDeleteColumn={columnCount > 1}
            cell={designerCell}
            placement="right"
            onCellAction={handleDesignerCellAction}
            onIsActiveChange={isActive => handleActiveRowChange(designerCell.rowIndex, isActive)}
            />
        </div>
      </td>
    );
  };

  const renderColumnHeaderCell = designerCell => {
    return (
      <td
        className="TableDesigner-tableCell TableDesigner-tableCell--columnHeader"
        key={designerCell.key}
        >
        <div className="TableDesigner-headerCellMenuContainer">
          <TableDesignerMenu
            canDeleteRow={rowCount > 1}
            canDeleteColumn={columnCount > 1}
            cell={designerCell}
            placement="bottom"
            onCellAction={handleDesignerCellAction}
            onIsActiveChange={isActive => handleActiveColumnChange(designerCell.columnIndex, isActive)}
            />
        </div>
      </td>
    );
  };

  const renderContentCell = designerCell => {
    const isInActiveRow = designerCell.rowIndex <= activeRowIndex && designerCell.rowIndex + designerCell.rowSpan - 1 >= activeRowIndex;
    const isInActiveColumn = designerCell.columnIndex <= activeColumnIndex && designerCell.columnIndex + designerCell.columnSpan - 1 >= activeColumnIndex;

    const props = {
      className: classNames({
        'is-active': isInActiveRow || isInActiveColumn,
        'TableDesigner-tableCell': true,
        'TableDesigner-tableCell--content': true,
        'TableDesigner-tableCell--cellTypeHeader': designerCell.cellType === CELL_TYPE.header,
        'TableDesigner-tableCell--cellTypeBody': designerCell.cellType === CELL_TYPE.body
      }),
      key: designerCell.key,
      rowSpan: designerCell.rowSpan,
      colSpan: designerCell.columnSpan,
      onClick: handleContentCellClick
    };

    const children = (
      <Fragment>
        <DebouncedInput
          elementType={MarkdownInput}
          data-role={CONTENT_INPUT_DATA_ROLE}
          className="TableDesigner-contentInput"
          value={designerCell.text}
          onChange={newText => handleDesignerCellTextChange(designerCell, newText)}
          renderMedia={content.renderMedia}
          autoSize={{ minRows: 1 }}
          noHelp
          />
        <div className="TableDesigner-contentCellMenuContainer">
          <TableDesignerMenu
            canDeleteRow={!designerCell.isConnected && !(designerCell.isFirstInColumn && designerCell.isLastInColumn)}
            canDeleteColumn={!designerCell.isConnected && !(designerCell.isFirstInRow && designerCell.isLastInRow)}
            cell={designerCell}
            placement="bottom"
            dotType="zooming"
            onCellAction={handleDesignerCellAction}
            />
        </div>
        <div className="TableDesigner-contentCellMarkdownHelpContainer">
          <MarkdownHelp size="small" />
        </div>
      </Fragment>
    );

    switch (designerCell.cellType) {
      case CELL_TYPE.header:
        return <th {...props}>{children}</th>;
      case CELL_TYPE.body:
        return <td {...props}>{children}</td>;
      default:
        throw new Error(`Invalid cell type: ${designerCell.cellType}`);
    }
  };

  const renderDefaultCell = designerCell => {
    return (
      <td
        className="TableDesigner-tableCell"
        key={designerCell.key}
        />
    );
  };

  const renderDesignerCell = designerCell => {
    switch (designerCell.designerCellType) {
      case DESIGNER_CELL_TYPE.content:
        return renderContentCell(designerCell);
      case DESIGNER_CELL_TYPE.rowHeader:
        return renderRowHeaderCell(designerCell);
      case DESIGNER_CELL_TYPE.columnHeader:
        return renderColumnHeaderCell(designerCell);
      default:
        return renderDefaultCell(designerCell);
    }
  };

  const renderDesignerRow = designerRow => {
    return (
      <tr key={designerRow.map(designerCell => designerCell.key).join()}>
        {designerRow.map(designerCell => renderDesignerCell(designerCell))}
      </tr>
    );
  };

  return (
    <div className="TableDesigner">
      <table className="TableDesigner-table">
        <tbody>
          {designerRows.map(designerRow => renderDesignerRow(designerRow))}
        </tbody>
      </table>
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
