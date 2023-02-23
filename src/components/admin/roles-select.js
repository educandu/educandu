import React from 'react';
import { Tag } from 'antd';
import PropTypes from 'prop-types';
import { ROLE } from '../../domain/constants.js';
import { ensureIsExcluded, ensureIsIncluded } from '../../utils/array-utils.js';

const { CheckableTag } = Tag;

const ALL_ROLES = Object.values(ROLE);

export const ROLES_SELECT_DISPLAY = {
  block: 'block',
  inline: 'inline'
};

function RolesSelect({ display, value, onChange }) {
  const handleChange = (role, checked) => {
    const newRoles = checked ? ensureIsIncluded(value, role) : ensureIsExcluded(value, role);
    if (newRoles.length) {
      onChange(newRoles);
    }
  };

  return (
    <div className={`RolesSelect RolesSelect--${display}`}>
      {ALL_ROLES.map(role => {
        return (
          <CheckableTag
            key={role}
            checked={value.includes(role)}
            onChange={checked => handleChange(role, checked)}
            >
            {role}
          </CheckableTag>
        );
      })}
    </div>
  );
}

RolesSelect.propTypes = {
  value: PropTypes.arrayOf(PropTypes.oneOf(ALL_ROLES)).isRequired,
  onChange: PropTypes.func.isRequired,
  display: PropTypes.oneOf(Object.values(ROLES_SELECT_DISPLAY))
};

RolesSelect.defaultProps = {
  display: ROLES_SELECT_DISPLAY.block
};

export default RolesSelect;
