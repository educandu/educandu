import PropTypes from 'prop-types';
import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, Button, Dropdown, Collapse } from 'antd';
import DeleteIcon from '../components/icons/general/delete-icon.js';
import MoveUpIcon from '../components/icons/general/move-up-icon.js';
import MoveDownIcon from '../components/icons/general/move-down-icon.js';
import SettingsIcon from '../components/icons/main-menu/settings-icon.js';
import { confirmDeleteItem } from '../components/confirmation-dialogs.js';

function ItemPanel({
  index,
  header,
  children,
  onMoveUp,
  onMoveDown,
  onDelete,
  canDeleteLastItem,
  itemsCount,
  extraItems,
  onExtraItemClick
}) {
  const { t } = useTranslation();
  const settingsButtonRef = useRef(null);

  const handleDropdownClick = event => {
    event.stopPropagation();
  };

  const closeSettingsMenu = () => {
    settingsButtonRef.current.click();
  };

  const handleMenuClick = menuItem => {
    menuItem.domEvent.stopPropagation();
    closeSettingsMenu();

    switch (menuItem.key) {
      case 'moveUp':
        return onMoveUp(index);
      case 'moveDown':
        return onMoveDown(index);
      case 'delete':
        return confirmDeleteItem(t, header, () => onDelete(index));
      default:
        return onExtraItemClick(menuItem.key);
    }
  };

  const items = [];
  if (onMoveUp) {
    items.push({
      key: 'moveUp',
      label: t('common:moveUp'),
      icon: <MoveUpIcon className="u-dropdown-icon" />,
      disabled: index === 0
    });
  }
  if (onMoveDown) {
    items.push({
      key: 'moveDown',
      label: t('common:moveDown'),
      icon: <MoveDownIcon className="u-dropdown-icon" />,
      disabled: index === itemsCount - 1
    });
  }
  if (onDelete) {
    const isDeleteDisabled = !canDeleteLastItem && itemsCount <= 1;
    items.push({
      key: 'delete',
      label: t('common:delete'),
      icon: <DeleteIcon className="u-dropdown-icon" />,
      danger: !isDeleteDisabled,
      disabled: isDeleteDisabled
    });
  }

  items.push(...extraItems);

  const renderMenu = () => {
    if (!items.length) {
      return null;
    }
    const menu = <Menu items={items} onClick={handleMenuClick} />;
    return (
      <Dropdown overlay={menu} placement="bottomRight" trigger={['click']} onClick={handleDropdownClick}>
        <Button ref={settingsButtonRef} type="ghost" icon={<SettingsIcon />} size="small" />
      </Dropdown>
    );
  };

  return (
    <Collapse className="ItemPanel" defaultActiveKey="panel">
      <Collapse.Panel header={header} extra={renderMenu()} key="panel">
        {children}
      </Collapse.Panel>
    </Collapse>
  );
}

ItemPanel.propTypes = {
  canDeleteLastItem: PropTypes.bool,
  children: PropTypes.node.isRequired,
  extraItems: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.node,
    danger: PropTypes.bool,
    disabled: PropTypes.bool
  })),
  header: PropTypes.string,
  index: PropTypes.number,
  itemsCount: PropTypes.number,
  onDelete: PropTypes.func,
  onExtraItemClick: PropTypes.func,
  onMoveDown: PropTypes.func,
  onMoveUp: PropTypes.func
};

ItemPanel.defaultProps = {
  canDeleteLastItem: false,
  extraItems: [],
  header: '',
  index: 0,
  itemsCount: 1,
  onDelete: null,
  onExtraItemClick: () => {},
  onMoveDown: null,
  onMoveUp: null
};

export default ItemPanel;
