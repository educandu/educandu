const React = require('react');
const PropTypes = require('prop-types');
const { Menu, Dropdown } = require('antd');
const { usePermission } = require('../ui/hooks');
const permissions = require('../domain/permissions');
const { sectionShape } = require('../ui/default-prop-types');
const { ThunderboltOutlined } = require('@ant-design/icons');
const { confirmHardDelete } = require('./section-action-dialogs.jsx');
const { HARD_DELETE, createHardDelete } = require('../ui/section-actions');

const MenuItem = Menu.Item;
const redIconStyle = { color: 'red' };

function SectionActionDropdown({ children, section, onAction, onVisibleChange, placement }) {
  const canHardDelete = usePermission(permissions.HARD_DELETE_SECTION);

  const handleSectionMenuClick = ({ key }) => {
    switch (key) {
      case HARD_DELETE:
        confirmHardDelete(section, ({ deleteDescendants, deletionReason }) => onAction(createHardDelete(section, deletionReason, deleteDescendants)));
        break;
      default:
        throw new Error(`Invalid menu key: ${key}`);
    }

    return onVisibleChange && onVisibleChange(false);
  };

  const menuItems = [];

  if (canHardDelete && !section.deletedOn) {
    menuItems.push((
      <MenuItem key={HARD_DELETE}>
        <ThunderboltOutlined style={redIconStyle} />&nbsp;&nbsp;<span>Unwiderruflich löschen</span>
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

module.exports = SectionActionDropdown;
