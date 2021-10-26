import React from 'react';
import { Switch } from 'antd';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import { userShape } from './../ui/default-prop-types.js';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

class UserLockedOutStateEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
  }

  handleLockedOutStateChange(newLockedOutState) {
    const { user, onLockedOutStateChange } = this.props;
    onLockedOutStateChange(user, newLockedOutState);
  }

  render() {
    const { user } = this.props;
    return (
      <Switch
        checkedChildren={<CheckOutlined />}
        unCheckedChildren={<CloseOutlined />}
        checked={user.lockedOut}
        onChange={this.handleLockedOutStateChange}
        />
    );
  }
}

UserLockedOutStateEditor.propTypes = {
  onLockedOutStateChange: PropTypes.func.isRequired,
  user: userShape.isRequired
};

export default UserLockedOutStateEditor;
