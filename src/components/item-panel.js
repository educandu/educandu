import React from 'react';
import PropTypes from 'prop-types';
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
  itemsCount
}) {
  const { t } = useTranslation();

  const handleDropdownClick = event => {
    event.stopPropagation();
  };

  const handleMenuClick = menuItem => {
    menuItem.domEvent.stopPropagation();

    switch (menuItem.key) {
      case 'moveUp':
        return onMoveUp(index);
      case 'moveDown':
        return onMoveDown(index);
      case 'delete':
        return confirmDeleteItem(t, header, () => onDelete(index));
      default:
        throw new Error(`Unknown key: ${menuItem.key}`);
    }
  };

  const items = [
    {
      key: 'moveUp',
      label: t('common:moveUp'),
      icon: <MoveUpIcon className="u-dropdown-icon" />,
      disabled: index === 0
    },
    {
      key: 'moveDown',
      label: t('common:moveDown'),
      icon: <MoveDownIcon className="u-dropdown-icon" />,
      disabled: index === itemsCount - 1
    },
    {
      key: 'delete',
      label: t('common:delete'),
      icon: <DeleteIcon className="u-dropdown-icon" />,
      danger: true,
      disabled: itemsCount === 1
    }
  ];

  const menu = <Menu items={items} onClick={handleMenuClick} />;

  const renderMenu = () => (
    <Dropdown overlay={menu} placement="bottomRight" onClick={handleDropdownClick}>
      <Button type="ghost" icon={<SettingsIcon />} size="small" />
    </Dropdown>
  );

  return (
    <Collapse className="ItemPanel" defaultActiveKey="panel">
      <Collapse.Panel header={header} extra={renderMenu()} key="panel">
        {children}
      </Collapse.Panel>
    </Collapse>
  );
}

ItemPanel.propTypes = {
  children: PropTypes.node.isRequired,
  header: PropTypes.string,
  index: PropTypes.number.isRequired,
  itemsCount: PropTypes.number.isRequired,
  onDelete: PropTypes.func,
  onMoveDown: PropTypes.func,
  onMoveUp: PropTypes.func
};

ItemPanel.defaultProps = {
  header: '',
  onDelete: () => {},
  onMoveDown: () => {},
  onMoveUp: () => {}
};

export default ItemPanel;
