import React from 'react';
import { Tag } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useUser } from '../user-context.js';
import { ROLE } from '../../domain/constants.js';
import { ensureIsExcluded, ensureIsIncluded } from '../../utils/array-utils.js';

const { CheckableTag } = Tag;

const ALL_ROLES = Object.values(ROLE);

export const ROLES_SELECT_DISPLAY = {
  block: 'block',
  inline: 'inline'
};

function RolesSelect({ userId, display, value, onChange }) {
  const executingUser = useUser();

  const isOwnAdminRole = role => {
    return userId === executingUser._id && role === ROLE.admin;
  };

  const handleChange = (role, checked) => {
    if (isOwnAdminRole(role)) {
      return;
    }

    const newRoles = checked ? ensureIsIncluded(value, role) : ensureIsExcluded(value, role);
    if (newRoles.length) {
      onChange(newRoles);
    }
  };

  const renderRoleTag = role => {
    const classes = classNames(
      'RolesSelect-tag',
      { 'is-disabled': isOwnAdminRole(role) }
    );

    return (
      <CheckableTag
        key={role}
        className={classes}
        checked={value.includes(role)}
        onChange={checked => handleChange(role, checked)}
        >
        {role}
      </CheckableTag>
    );
  };

  const classes = classNames(
    'RolesSelect',
    { 'RolesSelect--block': display === ROLES_SELECT_DISPLAY.block },
    { 'RolesSelect--inline': display === ROLES_SELECT_DISPLAY.inline }
  );

  return (
    <div className={classes}>
      {ALL_ROLES.map(role => renderRoleTag(role))}
    </div>
  );
}

RolesSelect.propTypes = {
  userId: PropTypes.string,
  display: PropTypes.oneOf(Object.values(ROLES_SELECT_DISPLAY)),
  value: PropTypes.arrayOf(PropTypes.oneOf(ALL_ROLES)).isRequired,
  onChange: PropTypes.func.isRequired
};

RolesSelect.defaultProps = {
  display: ROLES_SELECT_DISPLAY.block,
  userId: null
};

export default RolesSelect;
