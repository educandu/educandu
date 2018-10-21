const React = require('react');
const autoBind = require('auto-bind');
const Icon = require('antd/lib/icon');
const PropTypes = require('prop-types');
const Switch = require('antd/lib/switch');
const { userShape } = require('./../ui/default-prop-types');

class UserLockedOutStateEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
  }

  handleLockedOutStateChange(newLockedOutState) {
    const { user, onLockedOutStateChange } = this.props;
    onLockedOutStateChange(user, newLockedOutState);
  }

  render() {
    const { user } = this.props;
    return (
      <Switch
        checkedChildren={<Icon type="check" />}
        unCheckedChildren={<Icon type="close" />}
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
