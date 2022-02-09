import React from 'react';
import { Tag } from 'antd';
import PropTypes from 'prop-types';
import { userShape } from './../ui/default-prop-types.js';

const { CheckableTag } = Tag;

function UserRoleTagEditor({ user, roleName, onRoleChange }) {
  const handleRoleChange = () => {
    let newRoles;
    if (user.roles.includes(roleName)) {
      newRoles = user.roles.filter(x => x !== roleName);
    } else {
      newRoles = [...user.roles, roleName];
    }
    onRoleChange(user, newRoles);
  };

  const isUserInRole = user.roles.includes(roleName);
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
  onRoleChange: PropTypes.func.isRequired,
  roleName: PropTypes.string.isRequired,
  user: userShape.isRequired
};

export default UserRoleTagEditor;
