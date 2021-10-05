import React from 'react';
import Page from '../page';
import firstBy from 'thenby';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import { Table, Popover } from 'antd';
import roles from '../../domain/roles';
import Logger from '../../common/logger';
import { inject } from '../container-context';
import errorHelper from '../../ui/error-helper';
import { withTranslation } from 'react-i18next';
import UserRoleTagEditor from '../user-role-tag-editor';
import UserApiClient from '../../services/user-api-client';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import CountryFlagAndName from '../localization/country-flag-and-name';
import UserLockedOutStateEditor from '../user-locked-out-state-editor';
import { userShape, translationProps } from '../../ui/default-prop-types';

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
    autoBind(this);
    this.state = {
      users: props.initialState,
      changedLockOutStates: {},
      changedRoles: {},
      isDirty: false
    };

    this.columns = [
      {
        title: () => this.props.t('username'),
        dataIndex: 'username',
        key: 'username',
        sorter: firstBy('username'),
        render: this.renderUsername
      }, {
        title: () => this.props.t('email'),
        dataIndex: 'email',
        key: 'email',
        sorter: firstBy('email')
      }, {
        title: () => this.props.t('id'),
        dataIndex: '_id',
        key: '_id',
        sorter: firstBy('_id')
      }, {
        title: () => this.props.t('expires'),
        dataIndex: 'expires',
        key: 'expires',
        sorter: firstBy('expires')
      }, {
        title: () => this.props.t('lockedOut'),
        dataIndex: 'lockedOut',
        key: 'lockedOut',
        sorter: firstBy('lockedOut'),
        render: this.renderLockedOutState
      }, {
        title: () => this.props.t('roles'),
        dataIndex: 'roles',
        key: 'roles',
        render: this.renderRoleTags
      }
    ];
  }

  renderUsername(username, user) {
    const { t } = this.props;
    const { profile } = user;

    if (profile) {
      const content = (
        <table>
          <tbody>
            <tr>
              <td>{t('firstName')}:&nbsp;&nbsp;</td>
              <td>{profile.firstName}</td>
            </tr>
            <tr>
              <td>{t('lastName')}:&nbsp;&nbsp;</td>
              <td>{profile.lastName}</td>
            </tr>
            <tr>
              <td>{t('street')}:&nbsp;&nbsp;</td>
              <td>{profile.street}</td>
            </tr>
            <tr>
              <td>{t('streetSupplement')}:&nbsp;&nbsp;</td>
              <td>{profile.streetSupplement}</td>
            </tr>
            <tr>
              <td>{t('postalCode')}:&nbsp;&nbsp;</td>
              <td>{profile.postalCode}</td>
            </tr>
            <tr>
              <td>{t('city')}:&nbsp;&nbsp;</td>
              <td>{profile.city}</td>
            </tr>
            <tr>
              <td>{t('country')}:&nbsp;&nbsp;</td>
              <td>{profile.country ? <CountryFlagAndName code={profile.country} name={profile.country} /> : ''}</td>
            </tr>
          </tbody>
        </table>
      );

      return (
        <Popover content={content} title={t('profile')} trigger="hover">
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
        await userApiClient.saveUserLockedOutState({ userId, lockedOut: newLockedOut });
      }

      for (const [userId, newRoles] of Object.entries(changedRoles)) {
        /* eslint-disable-next-line no-await-in-loop */
        await userApiClient.saveUserRoles({ userId, roles: newRoles });
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
      users,
      changedLockOutStates: {},
      changedRoles: {},
      isDirty: false
    });
  }

  render() {
    const { t } = this.props;
    const { users, isDirty } = this.state;

    const headerActions = [];
    if (isDirty) {
      headerActions.push({
        key: 'save',
        type: 'primary',
        icon: SaveOutlined,
        text: t('common:save'),
        handleClick: this.handleSaveClick
      });
      headerActions.push({
        key: 'close',
        icon: CloseOutlined,
        text: t('common:cancel'),
        handleClick: this.handleCancelClick
      });
    }

    return (
      <Page headerActions={headerActions}>
        <div className="UsersPage">
          <h1>{t('pageNames:users')}</h1>
          <Table dataSource={users} columns={this.columns} rowKey="_id" size="middle" bordered />
        </div>
      </Page>
    );
  }
}

Users.propTypes = {
  ...translationProps,
  initialState: PropTypes.arrayOf(userShape).isRequired,
  userApiClient: PropTypes.instanceOf(UserApiClient).isRequired
};

export default withTranslation('users')(inject({
  userApiClient: UserApiClient
}, Users));
