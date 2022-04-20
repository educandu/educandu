import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import LinkPopover from '../../components/link-popover.js';
import { DESIGNER_CELL_ACTION, DESIGNER_CELL_TYPE } from './table-utils.js';
import {
  InsertRowAboveOutlined,
  InsertRowBelowOutlined,
  DeleteRowOutlined,
  InsertRowLeftOutlined,
  InsertRowRightOutlined,
  DeleteColumnOutlined
} from '@ant-design/icons';

export const menuItemInfos = {
  [DESIGNER_CELL_ACTION.insertRowBefore]: { translationKey: 'cellAction_insertRowBefore', icon: InsertRowAboveOutlined },
  [DESIGNER_CELL_ACTION.insertRowAfter]: { translationKey: 'cellAction_insertRowAfter', icon: InsertRowBelowOutlined },
  [DESIGNER_CELL_ACTION.deleteRow]: { translationKey: 'cellAction_deleteRow', icon: DeleteRowOutlined },
  [DESIGNER_CELL_ACTION.insertColumnBefore]: { translationKey: 'cellAction_insertColumnBefore', icon: InsertRowLeftOutlined },
  [DESIGNER_CELL_ACTION.insertColumnAfter]: { translationKey: 'cellAction_insertColumnAfter', icon: InsertRowRightOutlined },
  [DESIGNER_CELL_ACTION.deleteColumn]: { translationKey: 'cellAction_deleteColumn', icon: DeleteColumnOutlined }
};

function createMenuItem(t, action, cell, actionHandler, disabled = false, separator = false) {
  const menuItemInfo = menuItemInfos[action];
  if (!menuItemInfo) {
    throw Error(`Invalid menu action: '${action}'`);
  }

  return {
    key: action,
    text: t(menuItemInfo.translationKey),
    icon: menuItemInfo.icon,
    separator,
    disabled,
    onClick: () => actionHandler(action, cell)
  };
}

function TableDesignerMenu({ canDeleteColumn, canDeleteRow, cell, dotType, onCellAction, placement }) {
  const { t } = useTranslation('table');

  const createContentRowHeaderMenuItems = () => [
    createMenuItem(t, DESIGNER_CELL_ACTION.insertRowBefore, cell, onCellAction, false),
    createMenuItem(t, DESIGNER_CELL_ACTION.insertRowAfter, cell, onCellAction, false),
    createMenuItem(t, DESIGNER_CELL_ACTION.deleteRow, cell, onCellAction, !canDeleteRow)
  ];

  const createContentColumnHeaderMenuItems = () => [
    createMenuItem(t, DESIGNER_CELL_ACTION.insertColumnBefore, cell, onCellAction, false),
    createMenuItem(t, DESIGNER_CELL_ACTION.insertColumnAfter, cell, onCellAction, false),
    createMenuItem(t, DESIGNER_CELL_ACTION.deleteColumn, cell, onCellAction, !canDeleteColumn)
  ];

  const createContentCellMenuItems = () => [
    createMenuItem(t, DESIGNER_CELL_ACTION.insertRowBefore, cell, onCellAction, false),
    createMenuItem(t, DESIGNER_CELL_ACTION.insertRowAfter, cell, onCellAction, false),
    createMenuItem(t, DESIGNER_CELL_ACTION.deleteRow, cell, onCellAction, !canDeleteRow, true),
    createMenuItem(t, DESIGNER_CELL_ACTION.insertColumnBefore, cell, onCellAction, false),
    createMenuItem(t, DESIGNER_CELL_ACTION.insertColumnAfter, cell, onCellAction, false),
    createMenuItem(t, DESIGNER_CELL_ACTION.deleteColumn, cell, !canDeleteColumn, false)
  ];

  let items;
  switch (cell.cellType) {
    case DESIGNER_CELL_TYPE.content:
      items = createContentCellMenuItems(cell);
      break;
    case DESIGNER_CELL_TYPE.rowHeader:
      items = createContentRowHeaderMenuItems(cell);
      break;
    case DESIGNER_CELL_TYPE.columnHeader:
      items = createContentColumnHeaderMenuItems(cell);
      break;
    default:
      items = [];
      break;
  }

  return (
    <LinkPopover items={items} placement={placement} trigger="click" renderSeparator="onlyWhenSpecified">
      <a className="TableDesignerMenu">
        <span className={`TableDesignerMenu-dot TableDesignerMenu-dot--${dotType}`} />
      </a>
    </LinkPopover>
  );
}

TableDesignerMenu.propTypes = {
  canDeleteColumn: PropTypes.bool.isRequired,
  canDeleteRow: PropTypes.bool.isRequired,
  cell: PropTypes.shape({
    cellType: PropTypes.oneOf(Object.values(DESIGNER_CELL_TYPE)).isRequired
  }).isRequired,
  dotType: PropTypes.oneOf([
    'normal',
    'zooming'
  ]),
  onCellAction: PropTypes.func,
  placement: PropTypes.oneOf([
    'top',
    'left',
    'right',
    'bottom',
    'topLeft',
    'topRight',
    'bottomLeft',
    'bottomRight',
    'leftTop',
    'leftBottom',
    'rightTop',
    'rightBottom'
  ])
};

TableDesignerMenu.defaultProps = {
  dotType: 'normal',
  onCellAction: () => {},
  placement: 'top'
};

export default TableDesignerMenu;
