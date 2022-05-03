import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import LinkPopover from '../../components/link-popover.js';
import { CELL_TYPE, DESIGNER_CELL_ACTION, DESIGNER_CELL_TYPE } from './table-utils.js';
import {
  InsertRowAboveOutlined,
  InsertRowBelowOutlined,
  DeleteRowOutlined,
  InsertRowLeftOutlined,
  InsertRowRightOutlined,
  DeleteColumnOutlined,
  MergeCellsOutlined,
  SplitCellsOutlined,
  BgColorsOutlined
} from '@ant-design/icons';

export const menuItemInfos = {
  [DESIGNER_CELL_ACTION.convertToHeaderRow]: { translationKey: 'cellAction_convertToHeaderRow', icon: BgColorsOutlined },
  [DESIGNER_CELL_ACTION.convertToBodyRow]: { translationKey: 'cellAction_convertToBodyRow', icon: BgColorsOutlined },
  [DESIGNER_CELL_ACTION.convertToHeaderColumn]: { translationKey: 'cellAction_convertToHeaderColumn', icon: BgColorsOutlined },
  [DESIGNER_CELL_ACTION.convertToBodyColumn]: { translationKey: 'cellAction_convertToBodyColumn', icon: BgColorsOutlined },
  [DESIGNER_CELL_ACTION.convertToHeaderCell]: { translationKey: 'cellAction_convertToHeaderCell', icon: BgColorsOutlined },
  [DESIGNER_CELL_ACTION.convertToBodyCell]: { translationKey: 'cellAction_convertToBodyCell', icon: BgColorsOutlined },
  [DESIGNER_CELL_ACTION.insertRowBefore]: { translationKey: 'cellAction_insertRowBefore', icon: InsertRowAboveOutlined },
  [DESIGNER_CELL_ACTION.insertRowAfter]: { translationKey: 'cellAction_insertRowAfter', icon: InsertRowBelowOutlined },
  [DESIGNER_CELL_ACTION.deleteRow]: { translationKey: 'cellAction_deleteRow', icon: DeleteRowOutlined },
  [DESIGNER_CELL_ACTION.insertColumnBefore]: { translationKey: 'cellAction_insertColumnBefore', icon: InsertRowLeftOutlined },
  [DESIGNER_CELL_ACTION.insertColumnAfter]: { translationKey: 'cellAction_insertColumnAfter', icon: InsertRowRightOutlined },
  [DESIGNER_CELL_ACTION.deleteColumn]: { translationKey: 'cellAction_deleteColumn', icon: DeleteColumnOutlined },
  [DESIGNER_CELL_ACTION.connectToRowBefore]: { translationKey: 'cellAction_connectToRowBefore', icon: MergeCellsOutlined },
  [DESIGNER_CELL_ACTION.connectToRowAfter]: { translationKey: 'cellAction_connectToRowAfter', icon: MergeCellsOutlined },
  [DESIGNER_CELL_ACTION.connectToColumnBefore]: { translationKey: 'cellAction_connectToColumnBefore', icon: MergeCellsOutlined },
  [DESIGNER_CELL_ACTION.connectToColumnAfter]: { translationKey: 'cellAction_connectToColumnAfter', icon: MergeCellsOutlined },
  [DESIGNER_CELL_ACTION.disconnectCell]: { translationKey: 'cellAction_disconnectCell', icon: SplitCellsOutlined }
};

function TableDesignerMenu({ canDeleteColumn, canDeleteRow, cell, dotType, onCellAction, placement }) {
  const { t } = useTranslation('table');

  const createMenuItem = ({ action, disabled = false, separator = false }) => {
    const menuItemInfo = menuItemInfos[action];
    return {
      key: action,
      text: t(menuItemInfo.translationKey),
      icon: menuItemInfo.icon,
      separator,
      disabled,
      onClick: () => onCellAction(action, cell)
    };
  };

  let items;
  switch (cell.designerCellType) {
    case DESIGNER_CELL_TYPE.rowHeader:
      items = [
        createMenuItem({ action: DESIGNER_CELL_ACTION.convertToHeaderRow }),
        createMenuItem({ action: DESIGNER_CELL_ACTION.convertToBodyRow, separator: true }),
        createMenuItem({ action: DESIGNER_CELL_ACTION.insertRowBefore }),
        createMenuItem({ action: DESIGNER_CELL_ACTION.insertRowAfter }),
        createMenuItem({ action: DESIGNER_CELL_ACTION.deleteRow, disabled: !canDeleteRow })
      ];
      break;
    case DESIGNER_CELL_TYPE.columnHeader:
      items = [
        createMenuItem({ action: DESIGNER_CELL_ACTION.convertToHeaderColumn }),
        createMenuItem({ action: DESIGNER_CELL_ACTION.convertToBodyColumn, separator: true }),
        createMenuItem({ action: DESIGNER_CELL_ACTION.insertColumnBefore }),
        createMenuItem({ action: DESIGNER_CELL_ACTION.insertColumnAfter }),
        createMenuItem({ action: DESIGNER_CELL_ACTION.deleteColumn, disabled: !canDeleteColumn })
      ];
      break;
    case DESIGNER_CELL_TYPE.content:
      items = [
        createMenuItem({
          action: cell.cellType === CELL_TYPE.body ? DESIGNER_CELL_ACTION.convertToHeaderCell : DESIGNER_CELL_ACTION.convertToBodyCell,
          separator: true
        }),
        createMenuItem({ action: DESIGNER_CELL_ACTION.insertRowBefore }),
        createMenuItem({ action: DESIGNER_CELL_ACTION.insertRowAfter }),
        createMenuItem({ action: DESIGNER_CELL_ACTION.deleteRow, disabled: !canDeleteRow, separator: true }),
        createMenuItem({ action: DESIGNER_CELL_ACTION.insertColumnBefore }),
        createMenuItem({ action: DESIGNER_CELL_ACTION.insertColumnAfter }),
        createMenuItem({ action: DESIGNER_CELL_ACTION.deleteColumn, disabled: !canDeleteColumn, separator: true }),
        createMenuItem({ action: DESIGNER_CELL_ACTION.connectToRowBefore, disabled: cell.isFirstInColumn }),
        createMenuItem({ action: DESIGNER_CELL_ACTION.connectToRowAfter, disabled: cell.isLastInColumn }),
        createMenuItem({ action: DESIGNER_CELL_ACTION.connectToColumnBefore, disabled: cell.isFirstInRow }),
        createMenuItem({ action: DESIGNER_CELL_ACTION.connectToColumnAfter, disabled: cell.isLastInRow }),
        createMenuItem({ action: DESIGNER_CELL_ACTION.disconnectCell, disabled: !cell.isConnected })
      ];
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
    designerCellType: PropTypes.oneOf(Object.values(DESIGNER_CELL_TYPE)).isRequired,
    cellType: PropTypes.oneOf(Object.values(CELL_TYPE)),
    isFirstInRow: PropTypes.bool,
    isLastInRow: PropTypes.bool,
    isFirstInColumn: PropTypes.bool,
    isLastInColumn: PropTypes.bool,
    isConnected: PropTypes.bool
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
