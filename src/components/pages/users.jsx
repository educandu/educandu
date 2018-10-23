const React = require('react');
const firstBy = require('thenby');
const Page = require('../page.jsx');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const Table = require('antd/lib/table');
const message = require('antd/lib/message');
const roles = require('../../domain/roles');
const PageHeader = require('../page-header.jsx');
const PageFooter = require('../page-footer.jsx');
const PageContent = require('../page-content.jsx');
const { inject } = require('../container-context.jsx');
const { userShape } = require('../../ui/default-prop-types');
const UserApiClient = require('../../services/user-api-client');
const UserRoleTagEditor = require('../user-role-tag-editor.jsx');
const UserLockedOutStateEditor = require('../user-locked-out-state-editor.jsx');

const availableRoles = [
  { name: roles.USER, isReadonly: false },
  { name: roles.EDITOR, isReadonly: false },
  { name: roles.SUPER_EDITOR, isReadonly: false },
  { name: roles.SUPER_USER, isReadonly: true }
];


class Users extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
    this.state = {
      users: props.initialState
    };
  }

  renderRoleTags(userRoles, user) {
    return availableRoles.map(ar => {
      return (
        <UserRoleTagEditor
          key={ar.name}
          user={user}
          roleName={ar.name}
          isReadonly={ar.isReadonly}
          onRoleChange={this.handleRoleChange}
          />
      );
    });
  }

  renderLockedOutState(lockedOut, user) {
    return <UserLockedOutStateEditor user={user} onLockedOutStateChange={this.handleLockedOutStateChange} />;
  }

  async handleRoleChange(user, newRoles) {
    const { userApiClient } = this.props;
    try {
      const result = await userApiClient.saveUserRoles({ userId: user._id, roles: newRoles });
      this.setState(prevState => {
        return {
          ...prevState,
          users: prevState.users.map(usr => usr._id === user._id ? { ...user, roles: result.roles } : usr)
        };
      });
    } catch (err) {
      message.error(err.message);
    }
  }

  async handleLockedOutStateChange(user, newLockedOutState) {
    const { userApiClient } = this.props;
    try {
      const result = await userApiClient.saveUserLockedOutState({ userId: user._id, lockedOut: newLockedOutState });
      this.setState(prevState => {
        return {
          ...prevState,
          users: prevState.users.map(usr => usr._id === user._id ? { ...user, lockedOut: result.lockedOut } : usr)
        };
      });
    } catch (err) {
      message.error(err.message);
    }
  }

  render() {
    const { users } = this.state;

    const columns = [
      {
        title: 'Benutzername',
        dataIndex: 'username',
        key: 'username',
        sorter: firstBy('username'),
        render: username => <b>{username}</b>
      }, {
        title: 'E-Mail',
        dataIndex: 'email',
        key: 'email',
        sorter: firstBy('email')
      }, {
        title: 'Id',
        dataIndex: '_id',
        key: '_id',
        sorter: firstBy('_id')
      }, {
        title: 'Verfallsdatum',
        dataIndex: 'expires',
        key: 'expires',
        sorter: firstBy('expires')
      }, {
        title: 'Ausgesperrt',
        dataIndex: 'lockedOut',
        key: 'lockedOut',
        sorter: firstBy('lockedOut'),
        render: this.renderLockedOutState
      }, {
        title: 'Rollen',
        dataIndex: 'roles',
        key: 'roles',
        render: this.renderRoleTags
      }
    ];

    return (
      <Page>
        <PageHeader />
        <PageContent>
          <h1>Benutzer</h1>
          <Table dataSource={users} columns={columns} rowKey="_id" />
        </PageContent>
        <PageFooter />
      </Page>
    );
  }
}

Users.propTypes = {
  initialState: PropTypes.arrayOf(userShape).isRequired,
  userApiClient: PropTypes.instanceOf(UserApiClient).isRequired
};

module.exports = inject({
  userApiClient: UserApiClient
}, Users);
