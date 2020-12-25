const React = require('react');
const { Switch } = require('antd');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const { userShape } = require('./../ui/default-prop-types');
const { CheckOutlined, CloseOutlined } = require('@ant-design/icons');

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

module.exports = UserLockedOutStateEditor;
