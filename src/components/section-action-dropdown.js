import React from 'react';
import PropTypes from 'prop-types';
import { Menu, Dropdown } from 'antd';
import { usePermission } from '../ui/hooks.js';
import { useTranslation } from 'react-i18next';
import permissions from '../domain/permissions.js';
import { ThunderboltOutlined } from '@ant-design/icons';
import { sectionShape } from '../ui/default-prop-types.js';
import { confirmSectionHardDelete } from './confirmation-dialogs.js';
import { SECTION_ACTIONS, createHardDelete } from '../ui/section-actions.js';

const MenuItem = Menu.Item;
const redIconStyle = { color: 'red' };

function SectionActionDropdown({ children, section, onAction, onVisibleChange, placement }) {
  const { t } = useTranslation();
  const canHardDelete = usePermission(permissions.HARD_DELETE_SECTION);

  const handleSectionMenuClick = ({ key }) => {
    switch (key) {
      case SECTION_ACTIONS.hardDelete:
        confirmSectionHardDelete(t, ({ reason, deleteAllRevisions }) => onAction(createHardDelete(section, reason, deleteAllRevisions)));
        break;
      default:
        throw new Error(`Invalid menu key: ${key}`);
    }

    return onVisibleChange && onVisibleChange(false);
  };

  const menuItems = [];

  if (canHardDelete && !section.deletedOn) {
    menuItems.push((
      <MenuItem key={SECTION_ACTIONS.hardDelete}>
        <ThunderboltOutlined style={redIconStyle} />&nbsp;&nbsp;<span>{t('common:hardDelete')}</span>
      </MenuItem>
    ));
  }

  if (!menuItems.length) {
    return null;
  }

  const actionsMenu = <Menu onClick={handleSectionMenuClick}>{menuItems}</Menu>;

  return (
    <Dropdown
      overlay={actionsMenu}
      placement={placement}
      onVisibleChange={visible => onVisibleChange && onVisibleChange(visible)}
      >
      {children}
    </Dropdown>
  );
}

SectionActionDropdown.propTypes = {
  children: PropTypes.node,
  onAction: PropTypes.func.isRequired,
  onVisibleChange: PropTypes.func,
  placement: PropTypes.oneOf(['bottomLeft', 'bottomCenter', 'bottomRight', 'topLeft', 'topCenter', 'topRight']),
  section: sectionShape.isRequired
};

SectionActionDropdown.defaultProps = {
  children: null,
  onVisibleChange: null,
  placement: 'bottomLeft'
};

export default SectionActionDropdown;
