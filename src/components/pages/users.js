import React from 'react';
import firstBy from 'thenby';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import Logger from '../../common/logger.js';
import { ROLE } from '../../domain/role.js';
import { Table, Popover, Menu } from 'antd';
import { withUser } from '../user-context.js';
import { withTranslation } from 'react-i18next';
import { inject } from '../container-context.js';
import errorHelper from '../../ui/error-helper.js';
import { withPageName } from '../page-name-context.js';
import UserRoleTagEditor from '../user-role-tag-editor.js';
import { getGlobalAlerts } from '../../ui/global-alerts.js';
import UserApiClient from '../../services/user-api-client.js';
import CountryFlagAndName from '../localization/country-flag-and-name.js';
import UserLockedOutStateEditor from '../user-locked-out-state-editor.js';
import { userShape, translationProps, userProps, pageNameProps } from '../../ui/default-prop-types.js';

const logger = new Logger(import.meta.url);

const MenuItem = Menu.Item;

const availableRoles = Object.values(ROLE);

const TABS = {
  internalUsers: 'internal-users',
  externalUsers: 'external-users'
};

function splitInternalAndExternalUsers(allUsers) {
  const internalUsers = [];
  const externalUsers = [];
  for (const user of allUsers) {
    const matches = (/^external\/(.+)$/).exec(user.provider);
    if (matches) {
      externalUsers.push({
        ...user,
        importSource: matches[1]
      });
    } else {
      internalUsers.push(user);
    }
  }

  return { internalUsers, externalUsers };
}

function replaceUserById(users, newUser) {
  return users.map(user => user._id === newUser._id ? newUser : user);
}

class Users extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);

    this.state = {
      ...splitInternalAndExternalUsers(props.initialState),
      currentTab: TABS.internalUsers,
      isSaving: false
    };

    this.internalUserTableColumns = [
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

    this.externalUserTableColumns = [
      {
        title: () => this.props.t('username'),
        dataIndex: 'username',
        key: 'username',
        sorter: firstBy('username'),
        render: this.renderUsername
      }, {
        title: () => this.props.t('importSource'),
        dataIndex: 'importSource',
        key: 'importSource',
        sorter: firstBy('importSource')
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

  renderRoleTags(_userRoles, user) {
    return availableRoles.map(role => {
      return (
        <UserRoleTagEditor
          key={role}
          user={user}
          roleName={role}
          onRoleChange={this.handleRoleChange}
          />
      );
    });
  }

  renderLockedOutState(_lockedOut, user) {
    return <UserLockedOutStateEditor user={user} onLockedOutStateChange={this.handleLockedOutStateChange} />;
  }

  handleTabClick(evt) {
    this.setState({ currentTab: evt.key });
  }

  async handleRoleChange(user, newRoles) {
    const { userApiClient, t } = this.props;
    const oldRoles = user.roles;

    this.setState(prevState => ({
      ...prevState,
      internalUsers: replaceUserById(prevState.internalUsers, { ...user, roles: newRoles }),
      isSaving: true
    }));

    try {
      await userApiClient.saveUserRoles({ userId: user._id, roles: newRoles });
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
      this.setState(prevState => ({
        ...prevState,
        internalUsers: replaceUserById(prevState.internalUsers, { ...user, roles: oldRoles })
      }));
    } finally {
      this.setState({ isSaving: false });
    }
  }

  async handleLockedOutStateChange(user, newLockedOut) {
    const { userApiClient, t } = this.props;
    const oldLockedOut = user.lockedOut;

    this.setState(prevState => ({
      ...prevState,
      internalUsers: replaceUserById(prevState.internalUsers, { ...user, lockedOut: newLockedOut }),
      isSaving: true
    }));

    try {
      await userApiClient.saveUserLockedOutState({ userId: user._id, lockedOut: newLockedOut });
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
      this.setState(prevState => ({
        ...prevState,
        internalUsers: replaceUserById(prevState.internalUsers, { ...user, lockedOut: oldLockedOut })
      }));
    } finally {
      this.setState({ isSaving: false });
    }
  }

  render() {
    const { t, PageTemplate, pageName, user } = this.props;
    const { internalUsers, externalUsers, isSaving, currentTab } = this.state;

    const alerts = getGlobalAlerts(pageName, user);

    return (
      <PageTemplate alerts={alerts}>
        <div className="UsersPage">
          <h1>{t('pageNames:users')}</h1>
          <Menu onClick={this.handleTabClick} selectedKeys={[currentTab]} mode="horizontal" disabled={isSaving}>
            <MenuItem key={TABS.internalUsers}>{t('internalUsers')}</MenuItem>
            <MenuItem key={TABS.externalUsers}>{t('externalUsers')}</MenuItem>
          </Menu>
          <br />
          <br />
          {currentTab === TABS.internalUsers && (
            <Table
              dataSource={internalUsers}
              columns={this.internalUserTableColumns}
              rowKey="_id"
              size="middle"
              loading={isSaving}
              bordered
              />
          )}
          {currentTab === TABS.externalUsers && (
            <Table
              dataSource={externalUsers}
              columns={this.externalUserTableColumns}
              rowKey="_id"
              size="middle"
              bordered
              />
          )}
        </div>
      </PageTemplate>
    );
  }
}

Users.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  ...translationProps,
  ...userProps,
  ...pageNameProps,
  initialState: PropTypes.arrayOf(userShape).isRequired,
  userApiClient: PropTypes.instanceOf(UserApiClient).isRequired
};

export default withTranslation('users')(withPageName(withUser(inject({
  userApiClient: UserApiClient
}, Users))));
