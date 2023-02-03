import React from 'react';
import { Switch } from 'antd';
import PropTypes from 'prop-types';
import { CheckOutlined } from '@ant-design/icons';
import { useDateFormat } from '../locale-context.js';
import CloseIcon from '../icons/general/close-icon.js';

function UserAccountLockedStateEditor({ userAccountLockedOn, onAccountLockedOnChange }) {
  const { formatDate } = useDateFormat();

  const handleAccountLockedStateChange = isAccountLocked => {
    const accountLockedOn = isAccountLocked ? new Date().toISOString() : null;
    onAccountLockedOnChange(accountLockedOn);
  };

  return (
    <div className="UserAccountLockedStateEditor">
      <Switch
        size="small"
        checkedChildren={<CheckOutlined />}
        unCheckedChildren={<CloseIcon />}
        checked={!!userAccountLockedOn}
        onChange={handleAccountLockedStateChange}
        />
      {!!userAccountLockedOn && (
        <div className="UserAccountLockedStateEditor-date">
          {formatDate(userAccountLockedOn)}
        </div>
      )}
    </div>
  );
}

UserAccountLockedStateEditor.propTypes = {
  userAccountLockedOn: PropTypes.string,
  onAccountLockedOnChange: PropTypes.func.isRequired
};

UserAccountLockedStateEditor.defaultProps = {
  userAccountLockedOn: PropTypes.null
};

export default UserAccountLockedStateEditor;
