import PropTypes from 'prop-types';
import { Dropdown, Menu } from 'antd';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
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

function TableDesignerMenu({ canDeleteColumn, canDeleteRow, cell, dotType, onCellAction, onIsActiveChange }) {
  const { t } = useTranslation('table');
  const [isActive, setIsActive] = useState(false);
  const [isMouseOver, setIsMouseOver] = useState(false);
  const [isCellActionInProgress, setIsCellActionInProgress] = useState(false);

  useEffect(() => setIsActive(isMouseOver || isCellActionInProgress), [isMouseOver, isCellActionInProgress]);

  useEffect(() => onIsActiveChange(isActive), [isActive, onIsActiveChange]);

  const createMenuActionItem = ({ action, disabled = false }) => {
    const menuItemInfo = menuItemInfos[action];
    const IconComponent = menuItemInfo.icon;
    return {
      key: action,
      label: t(menuItemInfo.translationKey),
      icon: <IconComponent />,
      disabled
    };
  };

  const createMenuSeparatorItem = () => {
    return {
      type: 'divider'
    };
  };

  const handleDropdownVisibleChange = newValue => {
    setIsCellActionInProgress(newValue);
  };

  const handleMenuItemClick = ({ key }) => {
    setIsCellActionInProgress(false);
    onCellAction(key, cell);
  };

  let items;
  switch (cell.designerCellType) {
    case DESIGNER_CELL_TYPE.rowHeader:
      items = [
        createMenuActionItem({ action: DESIGNER_CELL_ACTION.convertToHeaderRow }),
        createMenuActionItem({ action: DESIGNER_CELL_ACTION.convertToBodyRow }),
        createMenuSeparatorItem(),
        createMenuActionItem({ action: DESIGNER_CELL_ACTION.insertRowBefore }),
        createMenuActionItem({ action: DESIGNER_CELL_ACTION.insertRowAfter }),
        createMenuActionItem({ action: DESIGNER_CELL_ACTION.deleteRow, disabled: !canDeleteRow })
      ];
      break;
    case DESIGNER_CELL_TYPE.columnHeader:
      items = [
        createMenuActionItem({ action: DESIGNER_CELL_ACTION.convertToHeaderColumn }),
        createMenuActionItem({ action: DESIGNER_CELL_ACTION.convertToBodyColumn }),
        createMenuSeparatorItem(),
        createMenuActionItem({ action: DESIGNER_CELL_ACTION.insertColumnBefore }),
        createMenuActionItem({ action: DESIGNER_CELL_ACTION.insertColumnAfter }),
        createMenuActionItem({ action: DESIGNER_CELL_ACTION.deleteColumn, disabled: !canDeleteColumn })
      ];
      break;
    case DESIGNER_CELL_TYPE.content:
      items = [
        createMenuActionItem({
          action: cell.cellType === CELL_TYPE.body ? DESIGNER_CELL_ACTION.convertToHeaderCell : DESIGNER_CELL_ACTION.convertToBodyCell,
          separator: true
        }),
        createMenuActionItem({ action: DESIGNER_CELL_ACTION.insertRowBefore }),
        createMenuActionItem({ action: DESIGNER_CELL_ACTION.insertRowAfter }),
        createMenuActionItem({ action: DESIGNER_CELL_ACTION.deleteRow, disabled: !canDeleteRow }),
        createMenuSeparatorItem(),
        createMenuActionItem({ action: DESIGNER_CELL_ACTION.insertColumnBefore }),
        createMenuActionItem({ action: DESIGNER_CELL_ACTION.insertColumnAfter }),
        createMenuActionItem({ action: DESIGNER_CELL_ACTION.deleteColumn, disabled: !canDeleteColumn }),
        createMenuSeparatorItem(),
        createMenuActionItem({ action: DESIGNER_CELL_ACTION.connectToRowBefore, disabled: cell.isFirstInColumn }),
        createMenuActionItem({ action: DESIGNER_CELL_ACTION.connectToRowAfter, disabled: cell.isLastInColumn }),
        createMenuActionItem({ action: DESIGNER_CELL_ACTION.connectToColumnBefore, disabled: cell.isFirstInRow }),
        createMenuActionItem({ action: DESIGNER_CELL_ACTION.connectToColumnAfter, disabled: cell.isLastInRow }),
        createMenuActionItem({ action: DESIGNER_CELL_ACTION.disconnectCell, disabled: !cell.isConnected })
      ];
      break;
    default:
      items = [];
      break;
  }

  const menu = <Menu items={items} onClick={handleMenuItemClick} />;

  return (
    <Dropdown overlay={menu} trigger={['click']} onVisibleChange={handleDropdownVisibleChange} arrow={{ pointAtCenter: true }}>
      <a className="TableDesignerMenu" onMouseOver={() => setIsMouseOver(true)} onMouseLeave={() => setIsMouseOver(false)}>
        <span className={`TableDesignerMenu-dot TableDesignerMenu-dot--${dotType}`} />
      </a>
    </Dropdown>
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
  onIsActiveChange: PropTypes.func
};

TableDesignerMenu.defaultProps = {
  dotType: 'normal',
  onCellAction: () => {},
  onIsActiveChange: () => {}
};

export default TableDesignerMenu;
