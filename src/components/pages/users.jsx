const React = require('react');
const firstBy = require('thenby');
const Page = require('../page.jsx');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const Table = require('antd/lib/table');
const Popover = require('antd/lib/popover');
const roles = require('../../domain/roles');
const Logger = require('../../common/logger');
const errorHelper = require('../../ui/error-helper');
const { inject } = require('../container-context.jsx');
const { userShape } = require('../../ui/default-prop-types');
const UserApiClient = require('../../services/user-api-client');
const UserRoleTagEditor = require('../user-role-tag-editor.jsx');
const CountryFlagAndName = require('../country-flag-and-name.jsx');
const UserLockedOutStateEditor = require('../user-locked-out-state-editor.jsx');

const logger = new Logger(__filename);

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
      users: props.initialState,
      changedLockOutStates: {},
      changedRoles: {},
      isDirty: false
    };

    this.columns = [
      {
        title: 'Benutzername',
        dataIndex: 'username',
        key: 'username',
        sorter: firstBy('username'),
        render: this.renderUsername
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
  }

  renderUsername(username, user) {
    const { profile } = user;

    if (profile) {
      const content = (
        <table>
          <tbody>
            <tr>
              <td>Vorname(n):&nbsp;&nbsp;</td>
              <td>{profile.firstName}</td>
            </tr>
            <tr>
              <td>Nachname:&nbsp;&nbsp;</td>
              <td>{profile.lastName}</td>
            </tr>
            <tr>
              <td>Straße:&nbsp;&nbsp;</td>
              <td>{profile.street}</td>
            </tr>
            <tr>
              <td>Straße (Zusatz):&nbsp;&nbsp;</td>
              <td>{profile.streetSupplement}</td>
            </tr>
            <tr>
              <td>Postleitzahl:&nbsp;&nbsp;</td>
              <td>{profile.postalCode}</td>
            </tr>
            <tr>
              <td>Ort:&nbsp;&nbsp;</td>
              <td>{profile.city}</td>
            </tr>
            <tr>
              <td>Land:&nbsp;&nbsp;</td>
              <td>{profile.country ? <CountryFlagAndName code={profile.country} name={profile.country} /> : ''}</td>
            </tr>
          </tbody>
        </table>
      );

      return (
        <Popover content={content} title="Profil" trigger="hover">
          <b>{username}</b>
        </Popover>
      );
    }

    return <b>{username}</b>;
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

  handleRoleChange(user, newRoles) {
    this.setState(prevState => {
      return {
        ...prevState,
        users: prevState.users.map(usr => usr._id === user._id ? { ...user, roles: newRoles } : usr),
        changedRoles: {
          ...prevState.changedRoles,
          [user._id]: newRoles
        },
        isDirty: true
      };
    });
  }

  handleLockedOutStateChange(user, newLockedOut) {
    this.setState(prevState => {
      return {
        ...prevState,
        users: prevState.users.map(usr => usr._id === user._id ? { ...user, lockedOut: newLockedOut } : usr),
        changedLockOutStates: {
          ...prevState.changedLockOutStates,
          [user._id]: newLockedOut
        },
        isDirty: true
      };
    });
  }

  async handleSaveClick() {
    const { userApiClient } = this.props;
    const { changedLockOutStates, changedRoles } = this.state;

    try {
      for (const [userId, newLockedOut] of Object.entries(changedLockOutStates)) {
        /* eslint-disable-next-line no-await-in-loop */
        await userApiClient.saveUserLockedOutState({ userId: userId, lockedOut: newLockedOut });
      }

      for (const [userId, newRoles] of Object.entries(changedRoles)) {
        /* eslint-disable-next-line no-await-in-loop */
        await userApiClient.saveUserRoles({ userId: userId, roles: newRoles });
      }
    } catch (error) {
      errorHelper.handleApiError(error, logger);
    }

    this.setState({
      changedLockOutStates: {},
      changedRoles: {},
      isDirty: false
    });
  }

  async handleCancelClick() {
    const { userApiClient } = this.props;

    const { users } = await userApiClient.getUsers();

    this.setState({
      users: users,
      changedLockOutStates: {},
      changedRoles: {},
      isDirty: false
    });
  }

  render() {
    const { users, isDirty } = this.state;

    const headerActions = [];
    if (isDirty) {
      headerActions.push({
        key: 'save',
        type: 'primary',
        icon: 'save',
        text: 'Speichern',
        handleClick: this.handleSaveClick
      });
      headerActions.push({
        key: 'close',
        icon: 'close',
        text: 'Abbrechen',
        handleClick: this.handleCancelClick
      });
    }

    return (
      <Page headerActions={headerActions}>
        <div className="UsersPage">
          <h1>Benutzer</h1>
          <Table dataSource={users} columns={this.columns} rowKey="_id" size="middle" bordered />
        </div>
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
