import React from 'react';
import { Switch } from 'antd';
import PropTypes from 'prop-types';
import { userShape } from './../ui/default-prop-types.js';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

function UserLockedOutStateEditor({ user, onLockedOutStateChange }) {
  const handleLockedOutStateChange = newLockedOutState => {
    onLockedOutStateChange(user, newLockedOutState);
  };

  return (
    <Switch
      checkedChildren={<CheckOutlined />}
      unCheckedChildren={<CloseOutlined />}
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
