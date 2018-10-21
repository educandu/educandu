const React = require('react');
const Tag = require('antd/lib/tag');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const { userShape } = require('./../ui/default-prop-types');

const COLOR_RED_10 = '#5c0011';

const { CheckableTag } = Tag;

class UserRoleTagEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
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
    const { roleName, isReadonly, user } = this.props;
    return isReadonly
      ? <Tag key={roleName} color={user.roles.includes(roleName) ? COLOR_RED_10 : null}>{roleName}</Tag>
      : <CheckableTag key={roleName} checked={user.roles.includes(roleName)} onChange={this.handleRoleChange}>{roleName}</CheckableTag>;
  }
}

UserRoleTagEditor.propTypes = {
  isReadonly: PropTypes.bool.isRequired,
  onRoleChange: PropTypes.func.isRequired,
  roleName: PropTypes.string.isRequired,
  user: userShape.isRequired
};

module.exports = UserRoleTagEditor;
