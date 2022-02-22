import by from 'thenby';
import PropTypes from 'prop-types';
import prettyBytes from 'pretty-bytes';
import Logger from '../../common/logger.js';
import UsedStorage from '../used-storage.js';
import { useUser } from '../user-context.js';
import { useTranslation } from 'react-i18next';
import { ROLE } from '../../domain/constants.js';
import errorHelper from '../../ui/error-helper.js';
import React, { useEffect, useState } from 'react';
import { replaceItem } from '../../utils/array-utils.js';
import UserRoleTagEditor from '../user-role-tag-editor.js';
import { useGlobalAlerts } from '../../ui/global-alerts.js';
import { Table, Popover, Tabs, Select, Button } from 'antd';
import { useDateFormat, useLocale } from '../locale-context.js';
import UserApiClient from '../../api-clients/user-api-client.js';
import RoomApiClient from '../../api-clients/room-api-client.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import CountryFlagAndName from '../localization/country-flag-and-name.js';
import UserLockedOutStateEditor from '../user-locked-out-state-editor.js';
import { confirmAllPrivateRoomsDelete } from '../confirmation-dialogs.js';
import { userShape, baseStoragePlanShape } from '../../ui/default-prop-types.js';

const logger = new Logger(import.meta.url);

const { TabPane } = Tabs;
const { Option } = Select;

const availableRoles = Object.values(ROLE);

const TABS = {
  internalUsers: 'internal-users',
  externalUsers: 'external-users',
  storageUsers: 'storage-users'
};

function createUserSubsets(users, storagePlans) {
  const storagePlansById = new Map(storagePlans.map(plan => [plan._id, plan]));

  const internalUsers = [];
  const externalUsers = [];
  const storageUsers = [];

  for (const user of users) {
    const enrichedUserObject = {
      ...user,
      storagePlan: storagePlansById.get(user.storage.plan) || null,
      importSource: (/^external\/(.+)$/).exec(user.provider)?.[1] || null
    };

    if (enrichedUserObject.importSource) {
      externalUsers.push(enrichedUserObject);
    } else {
      internalUsers.push(enrichedUserObject);
    }

    if (user.storage.plan || user.storage.usedBytes) {
      storageUsers.push(enrichedUserObject);
    }
  }

  return { internalUsers, externalUsers, storageUsers };
}

function Users({ initialState, PageTemplate }) {
  const executingUser = useUser();
  const { locale } = useLocale();
  const { formatDate } = useDateFormat();
  const alerts = useGlobalAlerts();
  const { t } = useTranslation('users');
  const userApiClient = useSessionAwareApiClient(UserApiClient);
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);

  const [isSaving, setIsSaving] = useState(false);
  const [users, setUsers] = useState(initialState.users);
  const [usersById, setUsersById] = useState(new Map());
  const [internalUsers, setInternalUsers] = useState([]);
  const [externalUsers, setExternalUsers] = useState([]);
  const [storageUsers, setStorageUsers] = useState([]);

  useEffect(() => {
    const subsets = createUserSubsets(users, initialState.storagePlans);
    setUsersById(new Map(users.map(user => [user._id, user])));
    setInternalUsers(subsets.internalUsers);
    setExternalUsers(subsets.externalUsers);
    setStorageUsers(subsets.storageUsers);
  }, [users, initialState.storagePlans]);

  const handleRoleChange = async (user, newRoles) => {
    const oldRoles = user.roles;

    setIsSaving(true);
    setUsers(oldUsers => replaceItem(oldUsers, { ...user, roles: newRoles }));

    try {
      await userApiClient.saveUserRoles({ userId: user._id, roles: newRoles });
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
      setUsers(oldUsers => replaceItem(oldUsers, { ...user, roles: oldRoles }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLockedOutStateChange = async (user, newLockedOut) => {
    const oldLockedOut = user.lockedOut;

    setIsSaving(true);
    setUsers(oldUsers => replaceItem(oldUsers, { ...user, lockedOut: newLockedOut }));

    try {
      await userApiClient.saveUserLockedOutState({ userId: user._id, lockedOut: newLockedOut });
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
      setUsers(oldUsers => replaceItem(oldUsers, { ...user, lockedOut: oldLockedOut }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleStoragePlanChange = async (user, newStoragePlanId) => {
    const oldStorage = user.storage;

    const newStorage = {
      ...oldStorage,
      plan: newStoragePlanId
    };

    setIsSaving(true);
    setUsers(oldUsers => replaceItem(oldUsers, { ...user, storage: newStorage }));

    let finalStorage;
    try {
      finalStorage = await userApiClient.saveUserStoragePlan({ userId: user._id, storagePlanId: newStoragePlanId });
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
      finalStorage = oldStorage;
    } finally {
      setUsers(oldUsers => replaceItem(oldUsers, { ...user, storage: finalStorage }));
      setIsSaving(false);
    }
  };

  const handleAddReminderClick = async user => {
    const oldStorage = user.storage;

    const newStorage = {
      ...oldStorage,
      reminders: [
        ...oldStorage.reminders,
        {
          timestamp: new Date().toISOString(),
          createdBy: executingUser._id
        }
      ]
    };

    setIsSaving(true);
    setUsers(oldUsers => replaceItem(oldUsers, { ...user, storage: newStorage }));

    let finalStorage;
    try {
      finalStorage = await userApiClient.addUserStorageReminder({ userId: user._id });
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
      finalStorage = oldStorage;
    } finally {
      setUsers(oldUsers => replaceItem(oldUsers, { ...user, storage: finalStorage }));
      setIsSaving(false);
    }
  };

  const handleRemoveRemindersClick = async user => {
    const oldStorage = user.storage;

    const newStorage = {
      ...oldStorage,
      reminders: []
    };

    setIsSaving(true);
    setUsers(oldUsers => replaceItem(oldUsers, { ...user, storage: newStorage }));

    let finalStorage;
    try {
      finalStorage = await userApiClient.deleteAllUserStorageReminders({ userId: user._id });
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
      finalStorage = oldStorage;
    } finally {
      setUsers(oldUsers => replaceItem(oldUsers, { ...user, storage: finalStorage }));
      setIsSaving(false);
    }
  };

  const handleDeleteAllPrivateRoomsClick = user => {
    confirmAllPrivateRoomsDelete(t, user.username, async () => {
      const oldStorage = user.storage;

      const newStorage = {
        plan: oldStorage.plan,
        usedBytes: 0,
        reminders: []
      };

      setIsSaving(true);
      setUsers(oldUsers => replaceItem(oldUsers, { ...user, storage: newStorage }));

      let finalStorage;
      try {
        await roomApiClient.deleteAllPrivateRoomsForUser({ ownerId: user._id });
        finalStorage = await userApiClient.deleteAllUserStorageReminders({ userId: user._id });
      } catch (error) {
        errorHelper.handleApiError({ error, logger, t });
        finalStorage = oldStorage;
      } finally {
        setUsers(oldUsers => replaceItem(oldUsers, { ...user, storage: finalStorage }));
        setIsSaving(false);
      }
    });
  };

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

  const renderEmail = email => {
    return <a href={`mailto:${encodeURI(email)}`}>{email}</a>;
  };

  const renderRoleTags = (_, user) => {
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

  const renderLockedOutState = (_, user) => {
    return <UserLockedOutStateEditor user={user} onLockedOutStateChange={handleLockedOutStateChange} />;
  };

  const renderStorage = (_, user) => {
    return (
      <Select
        size="small"
        className="UsersPage-storagePlanSelect"
        placeholder={t('selectPlan')}
        value={user.storage.plan}
        onChange={value => handleStoragePlanChange(user, value)}
        disabled={!!user.storage.plan}
        >
        {initialState.storagePlans.map(plan => (
          <Option key={plan._id} value={plan._id} label={plan.name}>
            <div className="UsersPage-storagePlanOption">
              <div className="UsersPage-storagePlanOptionName">{plan.name}</div>
              <div className="UsersPage-storagePlanOptionSize">{prettyBytes(plan.maxBytes, { locale })}</div>
            </div>
          </Option>
        ))}
      </Select>
    );
  };

  const renderStorageSpace = (_, user) => {
    return (
      <UsedStorage usedBytes={user.storage.usedBytes} maxBytes={user.storagePlan.maxBytes} />
    );
  };

  const renderReminders = (_, user) => {
    if (!user.storage.reminders.length) {
      return null;
    }

    return (
      <ol className="UsersPage-reminders">
        {user.storage.reminders.map(reminder => (
          <li key={reminder.timestamp}>
            {formatDate(reminder.timestamp)} ({usersById.get(reminder.createdBy)?.username || t('common:unknown')})
          </li>
        ))}
      </ol>
    );
  };

  const renderActions = (_, user) => {
    return (
      <div className="UsersPage-actions">
        <Button
          type="link"
          size="small"
          className="UsersPage-actionButton"
          onClick={() => handleAddReminderClick(user)}
          >
          {t('addReminder')}
        </Button>
        {!!user.storage.reminders.length && (
        <Button
          type="link"
          size="small"
          className="UsersPage-actionButton"
          onClick={() => handleRemoveRemindersClick(user)}
          >
          {t('removeAllReminders')}
        </Button>
        )}
        <Button
          type="link"
          size="small"
          className="UsersPage-actionButton"
          onClick={() => handleDeleteAllPrivateRoomsClick(user)}
          >
          {t('deleteAllPrivateRooms')}
        </Button>
      </div>
    );
  };

  const internalUserTableColumns = [
    {
      title: () => t('common:username'),
      dataIndex: 'username',
      key: 'username',
      sorter: by(x => x.username),
      render: renderUsername
    }, {
      title: () => t('common:email'),
      dataIndex: 'email',
      key: 'email',
      render: renderEmail,
      sorter: by(x => x.email)
    }, {
      title: () => t('expires'),
      dataIndex: 'expires',
      key: 'expires',
      sorter: by(x => x.expires),
      responsive: ['lg']
    }, {
      title: () => t('lockedOut'),
      dataIndex: 'lockedOut',
      key: 'lockedOut',
      sorter: by(x => x.lockedOut),
      render: renderLockedOutState,
      responsive: ['md']
    }, {
      title: () => t('roles'),
      dataIndex: 'roles',
      key: 'roles',
      render: renderRoleTags
    }, {
      title: () => t('common:storage'),
      dataIndex: 'storage',
      key: 'storage',
      render: renderStorage,
      sorter: by(x => x.storagePlan?.name),
      responsive: ['md']
    }
  ];

  const externalUserTableColumns = [
    {
      title: () => t('common:username'),
      dataIndex: 'username',
      key: 'username',
      sorter: by(x => x.username),
      render: renderUsername
    }, {
      title: () => t('importSource'),
      dataIndex: 'importSource',
      key: 'importSource',
      sorter: by(x => x.importSource)
    }
  ];

  const storageUserTableColumns = [
    {
      title: () => t('common:username'),
      dataIndex: 'username',
      key: 'username',
      sorter: by(x => x.username),
      render: renderUsername
    }, {
      title: () => t('common:email'),
      dataIndex: 'email',
      key: 'email',
      render: renderEmail,
      sorter: by(x => x.email)
    }, {
      title: () => t('common:storage'),
      dataIndex: 'storage',
      key: 'storage',
      render: renderStorage,
      sorter: by(x => x.storagePlan?.name),
      responsive: ['md']
    }, {
      title: () => t('storageSpace'),
      dataIndex: 'storageSpace',
      key: 'storageSpace',
      render: renderStorageSpace,
      sorter: by(x => x.storage.usedBytes),
      responsive: ['md']
    }, {
      title: () => t('reminders'),
      dataIndex: 'reminders',
      key: 'reminders',
      render: renderReminders,
      sorter: by(x => x.reminders.length),
      responsive: ['lg']
    }, {
      title: () => t('common:actions'),
      dataIndex: 'actions',
      key: 'actions',
      render: renderActions,
      responsive: ['lg']
    }
  ];

  return (
    <PageTemplate alerts={alerts}>
      <div className="UsersPage">
        <h1>{t('pageNames:users')}</h1>
        <Tabs className="Tabs" defaultActiveKey={TABS.internalUsers} type="line" size="large" disabled={isSaving}>
          <TabPane className="Tabs-tabPane" tab={t('internalUsers')} key={TABS.internalUsers}>
            <Table
              dataSource={internalUsers}
              columns={internalUserTableColumns}
              rowKey="_id"
              size="middle"
              loading={isSaving}
              bordered
              />
          </TabPane>
          <TabPane className="Tabs-tabPane" tab={t('externalUsers')} key={TABS.externalUsers}>
            <Table
              dataSource={externalUsers}
              columns={externalUserTableColumns}
              rowKey="_id"
              size="middle"
              bordered
              />
          </TabPane>
          <TabPane className="Tabs-tabPane" tab={t('storageUsers')} key={TABS.storageUsers}>
            <Table
              dataSource={storageUsers}
              columns={storageUserTableColumns}
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
  initialState: PropTypes.shape({
    users: PropTypes.arrayOf(userShape).isRequired,
    storagePlans: PropTypes.arrayOf(baseStoragePlanShape).isRequired
  }).isRequired
};

export default Users;
