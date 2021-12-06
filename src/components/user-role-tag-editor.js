import React from 'react';
import { Tag } from 'antd';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import { userShape } from './../ui/default-prop-types.js';

const { CheckableTag } = Tag;

class UserRoleTagEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
  }

  handleRoleChange() {
    const { user, roleName, onRoleChange } = this.props;
    let newRoles;
    if (user.roles.includes(roleName)) {
      newRoles = user.roles.filter(x => x !== roleName);
    } else {
      newRoles = [...user.roles, roleName];
    }
    onRoleChange(user, newRoles);
  }

  render() {
    const { roleName, user } = this.props;
    const isUserInRole = user.roles.includes(roleName);
    return (
      <CheckableTag
        key={roleName}
        checked={isUserInRole}
        onChange={this.handleRoleChange}
        >
        {roleName}
      </CheckableTag>
    );
  }
}

UserRoleTagEditor.propTypes = {
  onRoleChange: PropTypes.func.isRequired,
  roleName: PropTypes.string.isRequired,
  user: userShape.isRequired
};

export default UserRoleTagEditor;
