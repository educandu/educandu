import React from 'react';
import { Switch } from 'antd';
import PropTypes from 'prop-types';
import { CheckOutlined } from '@ant-design/icons';
import { useDateFormat } from './locale-context.js';
import CloseIcon from './icons/general/close-icon.js';
import { userShape } from '../ui/default-prop-types.js';

function UserAccountLockedStateEditor({ user, onAccountLockedOnChange }) {
  const { formatDate } = useDateFormat();

  const handleAccountLockedStateChange = isAccountLocked => {
    const accountLockedOn = isAccountLocked ? new Date().toISOString() : null;
    onAccountLockedOnChange(user, accountLockedOn);
  };

  return (
    <div className="UserAccountLockedStateEditor">
      <Switch
        size="small"
        checkedChildren={<CheckOutlined />}
        unCheckedChildren={<CloseIcon />}
        checked={!!user.accountLockedOn}
        onChange={handleAccountLockedStateChange}
        />
      {!!user.accountLockedOn && (
        <div className="UserAccountLockedStateEditor-date">
          {formatDate(user.accountLockedOn)}
        </div>
      )}
    </div>
  );
}

UserAccountLockedStateEditor.propTypes = {
  onAccountLockedOnChange: PropTypes.func.isRequired,
  user: userShape.isRequired
};

export default UserAccountLockedStateEditor;
