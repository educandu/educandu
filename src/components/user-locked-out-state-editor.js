import React from 'react';
import { Switch } from 'antd';
import PropTypes from 'prop-types';
import { CheckOutlined } from '@ant-design/icons';
import CloseIcon from './icons/general/close-icon.js';
import { userShape } from './../ui/default-prop-types.js';

function UserLockedOutStateEditor({ user, onLockedOutStateChange }) {
  const handleLockedOutStateChange = newLockedOutState => {
    onLockedOutStateChange(user, newLockedOutState);
  };

  return (
    <Switch
      size="small"
      checkedChildren={<CheckOutlined />}
      unCheckedChildren={<CloseIcon />}
      checked={user.lockedOut}
      onChange={handleLockedOutStateChange}
      />
  );
}

UserLockedOutStateEditor.propTypes = {
  onLockedOutStateChange: PropTypes.func.isRequired,
  user: userShape.isRequired
};

export default UserLockedOutStateEditor;
