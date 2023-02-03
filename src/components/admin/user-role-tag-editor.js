import React from 'react';
import { Tag } from 'antd';
import PropTypes from 'prop-types';

const { CheckableTag } = Tag;

function UserRoleTagEditor({ userRoles, roleName, onRoleChange }) {
  const handleRoleChange = () => {
    let newRoles;
    if (userRoles.includes(roleName)) {
      newRoles = userRoles.filter(x => x !== roleName);
    } else {
      newRoles = [...userRoles, roleName];
    }
    onRoleChange(newRoles);
  };

  const isUserInRole = userRoles.includes(roleName);
  return (
    <CheckableTag
      key={roleName}
      checked={isUserInRole}
      onChange={handleRoleChange}
      >
      {roleName}
    </CheckableTag>
  );
}

UserRoleTagEditor.propTypes = {
  userRoles: PropTypes.arrayOf(PropTypes.string).isRequired,
  roleName: PropTypes.string.isRequired,
  onRoleChange: PropTypes.func.isRequired
};

export default UserRoleTagEditor;
