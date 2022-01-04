import firstBy from 'thenby';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import Logger from '../../common/logger.js';
import { Table, Popover, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import { ROLE } from '../../domain/constants.js';
import errorHelper from '../../ui/error-helper.js';
import { useService } from '../container-context.js';
import { userShape } from '../../ui/default-prop-types.js';
import UserRoleTagEditor from '../user-role-tag-editor.js';
import { useGlobalAlerts } from '../../ui/global-alerts.js';
import UserApiClient from '../../api-clients/user-api-client.js';
import CountryFlagAndName from '../localization/country-flag-and-name.js';
import UserLockedOutStateEditor from '../user-locked-out-state-editor.js';

const logger = new Logger(import.meta.url);

const { TabPane } = Tabs;

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

function Users({ initialState, PageTemplate }) {
  const alerts = useGlobalAlerts();
  const { t } = useTranslation('users');
  const userApiClient = useService(UserApiClient);
  const { internalUsers, externalUsers } = splitInternalAndExternalUsers(initialState);
  const [state, setState] = useState({ isSaving: false, internalUsers, externalUsers });

  const renderUsername = (username, user) => {
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
  };

  const handleRoleChange = async (user, newRoles) => {
    const oldRoles = user.roles;

    setState(prevState => ({
      ...prevState,
      internalUsers: replaceUserById(prevState.internalUsers, { ...user, roles: newRoles }),
      isSaving: true
    }));

    try {
      await userApiClient.saveUserRoles({ userId: user._id, roles: newRoles });
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
      setState(prevState => ({
        ...prevState,
        internalUsers: replaceUserById(prevState.internalUsers, { ...user, roles: oldRoles })
      }));
    } finally {
      setState(prevState => ({ ...prevState, isSaving: false }));
    }
  };

  const renderRoleTags = (_userRoles, user) => {
    return availableRoles.map(role => {
      return (
        <UserRoleTagEditor
          key={role}
          user={user}
          roleName={role}
          onRoleChange={handleRoleChange}
          />
      );
    });
  };

  const handleLockedOutStateChange = async (user, newLockedOut) => {
    const oldLockedOut = user.lockedOut;

    setState(prevState => ({
      ...prevState,
      internalUsers: replaceUserById(prevState.internalUsers, { ...user, lockedOut: newLockedOut }),
      isSaving: true
    }));

    try {
      await userApiClient.saveUserLockedOutState({ userId: user._id, lockedOut: newLockedOut });
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
      setState(prevState => ({
        ...prevState,
        internalUsers: replaceUserById(prevState.internalUsers, { ...user, lockedOut: oldLockedOut })
      }));
    } finally {
      setState(prevState => ({ ...prevState, isSaving: false }));
    }
  };

  const renderLockedOutState = (_lockedOut, user) => {
    return <UserLockedOutStateEditor user={user} onLockedOutStateChange={handleLockedOutStateChange} />;
  };

  const internalUserTableColumns = [
    {
      title: () => t('username'),
      dataIndex: 'username',
      key: 'username',
      sorter: firstBy('username'),
      render: renderUsername
    }, {
      title: () => t('common:email'),
      dataIndex: 'email',
      key: 'email',
      sorter: firstBy('email')
    }, {
      title: () => t('expires'),
      dataIndex: 'expires',
      key: 'expires',
      sorter: firstBy('expires')
    }, {
      title: () => t('lockedOut'),
      dataIndex: 'lockedOut',
      key: 'lockedOut',
      sorter: firstBy('lockedOut'),
      render: renderLockedOutState
    }, {
      title: () => t('roles'),
      dataIndex: 'roles',
      key: 'roles',
      render: renderRoleTags
    }
  ];

  const externalUserTableColumns = [
    {
      title: () => t('username'),
      dataIndex: 'username',
      key: 'username',
      sorter: firstBy('username'),
      render: renderUsername
    }, {
      title: () => t('importSource'),
      dataIndex: 'importSource',
      key: 'importSource',
      sorter: firstBy('importSource')
    }
  ];

  return (
    <PageTemplate alerts={alerts}>
      <div className="UsersPage">
        <h1>{t('pageNames:users')}</h1>
        <Tabs className="Tabs" defaultActiveKey={TABS.internalUsers} type="line" size="large" disabled={state.isSaving}>
          <TabPane className="Tabs-tabPane" tab={t('internalUsers')} key={TABS.internalUsers}>
            <Table
              dataSource={state.internalUsers}
              columns={internalUserTableColumns}
              rowKey="_id"
              size="middle"
              loading={state.isSaving}
              bordered
              />
          </TabPane>
          <TabPane className="Tabs-tabPane" tab={t('externalUsers')} key={TABS.externalUsers}>
            <Table
              dataSource={state.externalUsers}
              columns={externalUserTableColumns}
              rowKey="_id"
              size="middle"
              bordered
              />
          </TabPane>
        </Tabs>
      </div>
    </PageTemplate>
  );
}

Users.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.arrayOf(userShape).isRequired
};

export default Users;
