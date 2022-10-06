import by from 'thenby';
import PropTypes from 'prop-types';
import prettyBytes from 'pretty-bytes';
import { Table, Tabs, Select } from 'antd';
import routes from '../../utils/routes.js';
import Logger from '../../common/logger.js';
import UsedStorage from '../used-storage.js';
import { useUser } from '../user-context.js';
import { useTranslation } from 'react-i18next';
import { ROLE } from '../../domain/constants.js';
import errorHelper from '../../ui/error-helper.js';
import React, { useEffect, useState } from 'react';
import { replaceItem } from '../../utils/array-utils.js';
import UserRoleTagEditor from '../user-role-tag-editor.js';
import { useDateFormat, useLocale } from '../locale-context.js';
import UserApiClient from '../../api-clients/user-api-client.js';
import RoomApiClient from '../../api-clients/room-api-client.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
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
  storageUsers: 'storage-users',
  closedAccountUsers: 'closed-accounts'
};

function createUserSubsets(users, storagePlans) {
  const storagePlansById = new Map(storagePlans.map(plan => [plan._id, plan]));

  const internalUsers = [];
  const externalUsers = [];
  const storageUsers = [];

  const activeAccountUsers = users.filter(user => !user.accountClosedOn);
  const closedAccountUsers = users.filter(user => user.accountClosedOn);

  for (const user of activeAccountUsers) {
    const enrichedUserObject = {
      ...user,
      storagePlan: storagePlansById.get(user.storage.planId) || null,
      importSource: (/^external\/(.+)$/).exec(user.provider)?.[1] || null
    };

    if (enrichedUserObject.importSource) {
      externalUsers.push(enrichedUserObject);
    } else {
      internalUsers.push(enrichedUserObject);
    }

    if (user.storage.planId || user.storage.usedBytes || user.storage.reminders.length) {
      storageUsers.push(enrichedUserObject);
    }
  }

  return { internalUsers, externalUsers, storageUsers, closedAccountUsers };
}

function Users({ initialState, PageTemplate }) {
  const executingUser = useUser();
  const { locale } = useLocale();
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('users');
  const userApiClient = useSessionAwareApiClient(UserApiClient);
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);

  const [isSaving, setIsSaving] = useState(false);
  const [users, setUsers] = useState(initialState.users);
  const [usersById, setUsersById] = useState(new Map());
  const [internalUsers, setInternalUsers] = useState([]);
  const [externalUsers, setExternalUsers] = useState([]);
  const [storageUsers, setStorageUsers] = useState([]);
  const [closedAccountUsers, setClosedAccountUsers] = useState([]);

  useEffect(() => {
    const subsets = createUserSubsets(users, initialState.storagePlans);
    setUsersById(new Map(users.map(user => [user._id, user])));
    setInternalUsers(subsets.internalUsers);
    setExternalUsers(subsets.externalUsers);
    setStorageUsers(subsets.storageUsers);
    setClosedAccountUsers(subsets.closedAccountUsers);
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
      finalStorage = await userApiClient.saveUserStoragePlan({ userId: user._id, storagePlanId: newStoragePlanId || null });
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
    confirmAllPrivateRoomsDelete(t, user.displayName, async () => {
      const oldStorage = user.storage;

      const newStorage = {
        plan: oldStorage.planId,
        usedBytes: 0,
        reminders: []
      };

      setIsSaving(true);
      setUsers(oldUsers => replaceItem(oldUsers, { ...user, storage: newStorage }));

      let finalStorage;
      try {
        await roomApiClient.deleteAllRoomsForUser({ ownerId: user._id });
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

  const renderDisplayName = (displayName, user) => {
    return <a href={routes.getUserUrl(user._id)}>{displayName}</a>;
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
        value={user.storage.planId}
        onChange={value => handleStoragePlanChange(user, value)}
        allowClear
        >
        {initialState.storagePlans.map(plan => (
          <Option key={plan._id} value={plan._id} label={plan.name}>
            <div className="UsersPage-storagePlanOption">
              <div>{plan.name}</div>
              <div className="UsersPage-storagePlanOptionSize">{prettyBytes(plan.maxBytes, { locale })}</div>
            </div>
          </Option>
        ))}
      </Select>
    );
  };

  const renderStorageSpace = (_, user) => {
    return (
      <UsedStorage usedBytes={user.storage.usedBytes} maxBytes={user.storagePlan?.maxBytes || 0} />
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
            {formatDate(reminder.timestamp)} ({usersById.get(reminder.createdBy)?.displayName || t('common:unknown')})
          </li>
        ))}
      </ol>
    );
  };

  const renderActions = (_, user) => {
    return (
      <div className="UsersPage-actions">
        <a className="UsersPage-actionButton" onClick={() => handleAddReminderClick(user)}>
          {t('addReminder')}
        </a>
        {!!user.storage.reminders.length && (
        <a className="UsersPage-actionButton" onClick={() => handleRemoveRemindersClick(user)}>
          {t('removeAllReminders')}
        </a>
        )}
        <a className="UsersPage-actionButton" onClick={() => handleDeleteAllPrivateRoomsClick(user)}>
          {t('deleteAllPrivateRooms')}
        </a>
      </div>
    );
  };

  const renderAccountClosedOn = accountClosedOn => {
    return <span>{formatDate(accountClosedOn)}</span>;
  };

  const internalUserTableColumns = [
    {
      title: () => t('common:displayName'),
      dataIndex: 'displayName',
      key: 'displayName',
      sorter: by(x => x.displayName, { ignoreCase: true }),
      render: renderDisplayName
    }, {
      title: () => t('common:email'),
      dataIndex: 'email',
      key: 'email',
      render: renderEmail,
      sorter: by(x => x.email, { ignoreCase: true })
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
      sorter: by(x => x.storagePlan?.name || '', { ignoreCase: true }),
      responsive: ['md']
    }
  ];

  const externalUserTableColumns = [
    {
      title: () => t('common:displayName'),
      dataIndex: 'displayName',
      key: 'displayName',
      sorter: by(x => x.displayName, { ignoreCase: true }),
      render: renderDisplayName
    }, {
      title: () => t('importSource'),
      dataIndex: 'importSource',
      key: 'importSource',
      sorter: by(x => x.importSource, { ignoreCase: true })
    }
  ];

  const storageUserTableColumns = [
    {
      title: () => t('common:displayName'),
      dataIndex: 'displayName',
      key: 'displayName',
      sorter: by(x => x.displayName, { ignoreCase: true }),
      render: renderDisplayName
    }, {
      title: () => t('common:email'),
      dataIndex: 'email',
      key: 'email',
      render: renderEmail,
      sorter: by(x => x.email, { ignoreCase: true })
    }, {
      title: () => t('common:storage'),
      dataIndex: 'storage',
      key: 'storage',
      render: renderStorage,
      sorter: by(x => x.storagePlan?.name || '', { ignoreCase: true }),
      responsive: ['md']
    }, {
      title: () => t('storageSpace'),
      dataIndex: 'storageSpace',
      key: 'storageSpace',
      render: renderStorageSpace,
      sorter: by(x => {
        if (!x.storage.usedBytes) {
          return 0;
        }

        if (!x.storagePlan?.maxBytes) {
          return 1 + x.storage.usedBytes;
        }

        return x.storage.usedBytes / x.storagePlan.maxBytes;
      }),
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

  const closedAccountUserTableColumns = [
    {
      title: () => t('common:displayName'),
      dataIndex: 'displayName',
      key: 'displayName',
      sorter: by(x => x.displayName, { ignoreCase: true }),
      render: renderDisplayName
    },
    {
      title: () => t('accountClosedOn'),
      dataIndex: 'accountClosedOn',
      key: 'accountClosedOn',
      sorter: by(x => x.accountClosedOn),
      render: renderAccountClosedOn
    }
  ];

  return (
    <PageTemplate>
      <div className="UsersPage">
        <h1>{t('pageNames:users')}</h1>
        <Tabs className="Tabs" defaultActiveKey={TABS.internalUsers} type="line" size="middle" disabled={isSaving}>
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
          <TabPane className="Tabs-tabPane" tab={t('closedAccountUsers')} key={TABS.closedAccountUsers}>
            <Table
              dataSource={closedAccountUsers}
              columns={closedAccountUserTableColumns}
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
