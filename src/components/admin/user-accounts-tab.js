import by from 'thenby';
import prettyBytes from 'pretty-bytes';
import routes from '../../utils/routes.js';
import Logger from '../../common/logger.js';
import UsedStorage from '../used-storage.js';
import { useUser } from '../user-context.js';
import { useTranslation } from 'react-i18next';
import { ROLE } from '../../domain/constants.js';
import { SearchOutlined } from '@ant-design/icons';
import UserRoleTagEditor from './user-role-tag-editor.js';
import { handleApiError } from '../../ui/error-helper.js';
import { useDateFormat, useLocale } from '../locale-context.js';
import React, { useCallback, useEffect, useState } from 'react';
import UserApiClient from '../../api-clients/user-api-client.js';
import RoomApiClient from '../../api-clients/room-api-client.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { Table, Tabs, Select, Input, Radio, message } from 'antd';
import StorageApiClient from '../../api-clients/storage-api-client.js';
import { confirmAllOwnedRoomsDelete } from '../confirmation-dialogs.js';
import UserAccountLockedStateEditor from './user-account-locked-state-editor.js';

const logger = new Logger(import.meta.url);

const { Option } = Select;
const RadioGroup = Radio.Group;

const TABLE = {
  activeAccounts: 'active-accounts',
  externalAccounts: 'external-accounts',
  accountsWithStorage: 'accounts-with-storage',
  closedAccounts: 'closed-accounts'
};

function createTableItemSubsets(users, externalAccounts, storagePlans) {
  const accountTableItemsById = new Map();
  const storagePlansById = new Map(storagePlans.map(plan => [plan._id, plan]));

  const activeAccountsTableItems = [];
  const closedAccountsTableItems = [];
  const externalAccountsTableItems = [];
  const accountsWithStorageTableItems = [];

  for (const user of users) {
    const accountTableItem = {
      ...user,
      key: user._id,
      storagePlan: storagePlansById.get(user.storage.planId) || null
    };

    if (user.accountClosedOn) {
      closedAccountsTableItems.push(accountTableItem);
    } else {
      activeAccountsTableItems.push(accountTableItem);
    }

    if (user.storage.planId || user.storage.usedBytes || user.storage.reminders.length) {
      accountsWithStorageTableItems.push(accountTableItem);
    }

    accountTableItemsById.set(user._id, accountTableItem);
  }

  for (const externalAccount of externalAccounts) {
    const accountTableItem = {
      ...externalAccount,
      key: externalAccount._id,
      connectedUser: accountTableItemsById.get(externalAccount.userId) || null
    };

    externalAccountsTableItems.push(accountTableItem);
  }

  return {
    activeAccountsTableItems,
    closedAccountsTableItems,
    externalAccountsTableItems,
    accountsWithStorageTableItems
  };
}

const filterTableItems = (items, filterText) => {
  return filterText
    ? items.filter(item => {
      const text = filterText.toLowerCase();
      return item.displayName?.toLowerCase().includes(text)
        || item.email?.toLowerCase().includes(text)
        || item.providerKey?.toLowerCase().includes(text)
        || item.externalUserId?.toLowerCase().includes(text)
        || item.connectedUser?.displayName.toLowerCase().includes(text);
    })
    : items;
};

function UserAccountsTab() {
  const { locale } = useLocale();
  const executingUser = useUser();
  const { formatDate } = useDateFormat();
  const [users, setUsers] = useState([]);
  const { t } = useTranslation('userAccountsTab');
  const [isSaving, setIsSaving] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [storagePlans, setStoragePlans] = useState([]);
  const [usersById, setUsersById] = useState(new Map());
  const [externalAccounts, setExternalAccounts] = useState([]);
  const userApiClient = useSessionAwareApiClient(UserApiClient);
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);
  const storageApiClient = useSessionAwareApiClient(StorageApiClient);
  const [currentTable, setCurrentTable] = useState(TABLE.activeAccounts);

  const [closedAccountsTableItems, setClosedAccountsTableItems] = useState([]);
  const [activeAccountsTableItems, setInternalAccountsTableItems] = useState([]);
  const [externalAccountsTableItems, setExternalAccountsTableItems] = useState([]);
  const [accountsWithStorageTableItems, setAccountsWithStorageTableItems] = useState([]);

  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [usersResponse, externalAccountsResponse, storagePlansResponse] = await Promise.all([
        userApiClient.getUsers(),
        userApiClient.getExternalAccounts(),
        storageApiClient.getAllStoragePlans(false)
      ]);
      setUsers(usersResponse.users);
      setExternalAccounts(externalAccountsResponse.externalAccounts);
      setStoragePlans(storagePlansResponse);
    } catch (error) {
      handleApiError({ error, logger, t });
    } finally {
      setIsLoading(false);
    }
  }, [userApiClient, storageApiClient, t]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    setUsersById(new Map(users.map(user => [user._id, user])));
    const tableItemSubsets = createTableItemSubsets(users, externalAccounts, storagePlans);
    setInternalAccountsTableItems(filterTableItems(tableItemSubsets.activeAccountsTableItems, filterText));
    setAccountsWithStorageTableItems(filterTableItems(tableItemSubsets.accountsWithStorageTableItems, filterText));
    setClosedAccountsTableItems(filterTableItems(tableItemSubsets.closedAccountsTableItems, filterText));
    setExternalAccountsTableItems(filterTableItems(tableItemSubsets.externalAccountsTableItems, filterText));
  }, [users, externalAccounts, storagePlans, filterText]);

  const handleUserRolesChange = async (userId, newRoles) => {
    setIsSaving(true);
    setUsers(oldUsers => oldUsers.map(user => user._id === userId ? { ...user, roles: newRoles } : user));

    try {
      await userApiClient.saveUserRoles({ userId, roles: newRoles });
      message.success({ content: t('common:changesSavedSuccessfully') });
    } catch (error) {
      handleApiError({ error, logger, t });
      refreshData();
    } finally {
      setIsSaving(false);
    }
  };

  const handleUserAccountLockedOnChange = async (userId, newAccountLockedOn) => {
    setIsSaving(true);
    setUsers(oldUsers => oldUsers.map(user => user._id === userId ? { ...user, accountLockedOn: newAccountLockedOn } : user));

    try {
      const updatedUser = await userApiClient.saveUserAccountLockedOnState({ userId, accountLockedOn: newAccountLockedOn });
      setUsers(oldUsers => oldUsers.map(user => user._id === userId ? updatedUser : user));
      message.success({ content: t('common:changesSavedSuccessfully') });
    } catch (error) {
      handleApiError({ error, logger, t });
      refreshData();
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveExternalAccountClick = async externalAccountId => {
    setIsSaving(true);
    setExternalAccounts(oldAccounts => oldAccounts.filter(account => account._id !== externalAccountId));

    try {
      await userApiClient.deleteExternalAccount({ externalAccountId });
      message.success({ content: t('common:changesSavedSuccessfully') });
    } catch (error) {
      handleApiError({ error, logger, t });
      refreshData();
    } finally {
      setIsSaving(false);
    }
  };

  const handleStoragePlanChange = async (userId, newStoragePlanId) => {
    setIsSaving(true);
    setUsers(oldUsers => oldUsers.map(user => user._id === userId ? { ...user, storage: { ...user.storage, plan: newStoragePlanId } } : user));

    try {
      const updatedStorage = await userApiClient.saveUserStoragePlan({ userId, storagePlanId: newStoragePlanId || null });
      setUsers(oldUsers => oldUsers.map(user => user._id === userId ? { ...user, storage: updatedStorage } : user));
      message.success({ content: t('common:changesSavedSuccessfully') });
    } catch (error) {
      handleApiError({ error, logger, t });
      refreshData();
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddReminderClick = async userId => {
    setIsSaving(true);
    setUsers(oldUsers => oldUsers.map(user => {
      return user._id === userId
        ? {
          ...user,
          storage: {
            ...user.storage,
            reminders: [
              ...user.storage.reminders,
              {
                timestamp: new Date().toISOString(),
                createdBy: executingUser._id
              }
            ]
          }
        }
        : user;
    }));

    try {
      const updatedStorage = await userApiClient.addUserStorageReminder({ userId });
      setUsers(oldUsers => oldUsers.map(user => user._id === userId ? { ...user, storage: updatedStorage } : user));
      message.success({ content: t('common:changesSavedSuccessfully') });
    } catch (error) {
      handleApiError({ error, logger, t });
      refreshData();
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveRemindersClick = async userId => {
    setIsSaving(true);
    setUsers(oldUsers => oldUsers.map(user => {
      return user._id === userId
        ? {
          ...user,
          storage: {
            ...user.storage,
            reminders: []
          }
        }
        : user;
    }));

    try {
      const updatedStorage = await userApiClient.deleteAllUserStorageReminders({ userId });
      setUsers(oldUsers => oldUsers.map(user => user._id === userId ? { ...user, storage: updatedStorage } : user));
      message.success({ content: t('common:changesSavedSuccessfully') });
    } catch (error) {
      handleApiError({ error, logger, t });
      refreshData();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAllOwnedRoomsClick = userId => {
    const displayName = usersById.get(userId)?.displayName || null;
    confirmAllOwnedRoomsDelete(t, displayName, async () => {
      setIsSaving(true);
      setUsers(oldUsers => oldUsers.map(user => {
        return user._id === userId
          ? {
            ...user,
            storage: {
              ...user.storage,
              usedBytes: 0,
              reminders: []
            }
          }
          : user;
      }));

      try {
        await roomApiClient.deleteAllRoomsForUser({ ownerId: userId });
        const updatedStorage = await userApiClient.deleteAllUserStorageReminders({ userId });
        setUsers(oldUsers => oldUsers.map(user => user._id === userId ? { ...user, storage: updatedStorage } : user));
        message.success({ content: t('common:changesSavedSuccessfully') });
      } catch (error) {
        handleApiError({ error, logger, t });
        refreshData();
      } finally {
        setIsSaving(false);
      }
    });
  };

  const renderDisplayName = (_, item) => {
    return <a href={routes.getUserProfileUrl(item.key)}>{item.displayName}</a>;
  };

  const renderConnectedUser = connectedUser => {
    return connectedUser
      ? renderDisplayName(connectedUser.displayName, connectedUser)
      : '';
  };

  const renderEmail = email => {
    return <a href={`mailto:${encodeURI(email)}`}>{email}</a>;
  };

  const renderRoleTags = (_, item) => {
    const userId = item.key;

    return Object.values(ROLE).map(role => {
      return (
        <UserRoleTagEditor
          key={role}
          roleName={role}
          userRoles={item.roles}
          onRoleChange={newRoles => handleUserRolesChange(userId, newRoles)}
          />
      );
    });
  };

  const renderAccountLockedOn = (_, item) => {
    const userId = item.key;

    return (
      <UserAccountLockedStateEditor
        userAccountLockedOn={item.accountLockedOn}
        onAccountLockedOnChange={newAccountLockedOn => handleUserAccountLockedOnChange(userId, newAccountLockedOn)}
        />
    );
  };

  const renderStorage = (_, item) => {
    const userId = item.key;

    return (
      <Select
        size="small"
        className="UserAccountsTab-storagePlanSelect"
        placeholder={t('selectPlan')}
        value={item.storage.planId}
        onChange={newStoragePlanId => handleStoragePlanChange(userId, newStoragePlanId)}
        allowClear
        >
        {storagePlans.map(plan => (
          <Option key={plan._id} value={plan._id} label={plan.name}>
            <div className="UserAccountsTab-storagePlanOption">
              <div>{plan.name}</div>
              <div className="UserAccountsTab-storagePlanOptionSize">{prettyBytes(plan.maxBytes, { locale })}</div>
            </div>
          </Option>
        ))}
      </Select>
    );
  };

  const renderStorageSpace = (_, item) => {
    return (
      <UsedStorage usedBytes={item.storage.usedBytes} maxBytes={item.storagePlan?.maxBytes || 0} />
    );
  };

  const renderReminders = (_, item) => {
    if (!item.storage.reminders.length) {
      return null;
    }

    return (
      <ol className="UserAccountsTab-reminders">
        {item.storage.reminders.map(reminder => (
          <li key={reminder.timestamp}>
            {formatDate(reminder.timestamp)} ({usersById.get(reminder.createdBy)?.displayName || t('common:unknown')})
          </li>
        ))}
      </ol>
    );
  };

  const renderExternalAccountsTableActions = (_, item) => {
    const externalAccountId = item.key;

    return (
      <div className="UserAccountsTab-actions">
        <a className="UserAccountsTab-actionButton" onClick={() => handleRemoveExternalAccountClick(externalAccountId)}>
          {t('common:delete')}
        </a>
      </div>
    );
  };

  const renderAccountsWithStorageTableActions = (_, item) => {
    const userId = item.key;

    return (
      <div className="UserAccountsTab-actions">
        <a className="UserAccountsTab-actionButton" onClick={() => handleAddReminderClick(userId)}>
          {t('addReminder')}
        </a>
        {!!item.storage.reminders.length && (
        <a className="UserAccountsTab-actionButton" onClick={() => handleRemoveRemindersClick(userId)}>
          {t('removeAllReminders')}
        </a>
        )}
        <a className="UserAccountsTab-actionButton" onClick={() => handleDeleteAllOwnedRoomsClick(userId)}>
          {t('deleteAllOwnedRooms')}
        </a>
      </div>
    );
  };

  const renderAccountClosedOn = accountClosedOn => {
    return <span>{formatDate(accountClosedOn)}</span>;
  };

  const internalAccountsTableColumns = [
    {
      title: () => t('common:displayName'),
      dataIndex: 'displayName',
      key: 'displayName',
      sorter: by(x => x.displayName, { ignoreCase: true }),
      render: renderDisplayName
    },
    {
      title: () => t('common:email'),
      dataIndex: 'email',
      key: 'email',
      render: renderEmail,
      sorter: by(x => x.email, { ignoreCase: true })
    },
    {
      title: () => t('expiryDate'),
      dataIndex: 'expiresOn',
      key: 'expiresOn',
      sorter: by(x => x.expiresOn || ''),
      render: expiresOn => formatDate(expiresOn),
      responsive: ['lg']
    },
    {
      title: () => t('lastLogin'),
      dataIndex: 'lastLoggedInOn',
      key: 'lastLoggedInOn',
      sorter: by(x => x.lastLoggedInOn || ''),
      render: lastLoggedInOn => formatDate(lastLoggedInOn),
      responsive: ['lg']
    },
    {
      title: () => t('accountLocked'),
      dataIndex: 'accountLockedOn',
      key: 'accountLockedOn',
      sorter: by(x => x.accountLockedOn || ''),
      render: renderAccountLockedOn,
      responsive: ['md']
    },
    {
      title: () => t('roles'),
      dataIndex: 'roles',
      key: 'roles',
      render: renderRoleTags
    },
    {
      title: () => t('common:storage'),
      dataIndex: 'storage',
      key: 'storage',
      render: renderStorage,
      sorter: by(x => x.storagePlan?.name || '', { ignoreCase: true }),
      responsive: ['md']
    }
  ];

  const externalAccountsTableColumns = [
    {
      title: () => t('providerKey'),
      dataIndex: 'providerKey',
      key: 'providerKey',
      sorter: by(x => x.providerKey, { ignoreCase: true })
    },
    {
      title: () => t('externalUserId'),
      dataIndex: 'externalUserId',
      key: 'externalUserId',
      sorter: by(x => x.externalUserId, { ignoreCase: true })
    },
    {
      title: () => t('connectedUser'),
      dataIndex: 'connectedUser',
      key: 'connectedUser',
      sorter: by(x => x.connectedUser?.displayName || '', { ignoreCase: true }),
      render: renderConnectedUser
    },
    {
      title: () => t('expiryDate'),
      dataIndex: 'expiresOn',
      key: 'expiresOn',
      sorter: by(x => x.expiresOn || ''),
      render: expiresOn => formatDate(expiresOn),
      responsive: ['lg']
    },
    {
      title: () => t('lastLogin'),
      dataIndex: 'lastLoggedInOn',
      key: 'lastLoggedInOn',
      sorter: by(x => x.lastLoggedInOn || ''),
      render: lastLoggedInOn => formatDate(lastLoggedInOn),
      responsive: ['lg']
    },
    {
      title: () => t('common:actions'),
      dataIndex: 'actions',
      key: 'actions',
      render: renderExternalAccountsTableActions,
      responsive: ['lg']
    }
  ];

  const accountsWithStorageTableColumns = [
    {
      title: () => t('common:displayName'),
      dataIndex: 'displayName',
      key: 'displayName',
      sorter: by(x => x.displayName, { ignoreCase: true }),
      render: renderDisplayName
    },
    {
      title: () => t('common:email'),
      dataIndex: 'email',
      key: 'email',
      render: renderEmail,
      sorter: by(x => x.email, { ignoreCase: true })
    },
    {
      title: () => t('common:storage'),
      dataIndex: 'storage',
      key: 'storage',
      render: renderStorage,
      sorter: by(x => x.storagePlan?.name || '', { ignoreCase: true }),
      responsive: ['md']
    },
    {
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
    },
    {
      title: () => t('reminders'),
      dataIndex: 'reminders',
      key: 'reminders',
      render: renderReminders,
      sorter: by(x => x.reminders.length),
      responsive: ['lg']
    },
    {
      title: () => t('common:actions'),
      dataIndex: 'actions',
      key: 'actions',
      render: renderAccountsWithStorageTableActions,
      responsive: ['lg']
    }
  ];

  const closedAccountsTableColumns = [
    {
      title: () => t('common:displayName'),
      dataIndex: 'displayName',
      key: 'displayName',
      sorter: by(x => x.displayName, { ignoreCase: true }),
      render: renderDisplayName
    },
    {
      title: () => t('common:email'),
      dataIndex: 'email',
      key: 'email',
      render: renderEmail,
      sorter: by(x => x.email, { ignoreCase: true })
    },
    {

      title: () => t('accountClosedOn'),
      dataIndex: 'accountClosedOn',
      key: 'accountClosedOn',
      sorter: by(x => x.accountClosedOn),
      render: renderAccountClosedOn
    }
  ];

  const renderTabChildren = (dataSource, columns) => (
    <div className="Tabs-tabPane Tabs-tabPane--noIndentation">
      <Table
        dataSource={dataSource}
        columns={columns}
        size="middle"
        loading={{ size: 'large', spinning: isLoading || isSaving, delay: 500 }}
        bordered
        />
    </div>
  );

  const views = [
    {
      key: TABLE.activeAccounts,
      label: t('activeAccounts'),
      tabContent: renderTabChildren(activeAccountsTableItems, internalAccountsTableColumns)
    },
    {
      key: TABLE.externalAccounts,
      label: t('externalAccounts'),
      tabContent: renderTabChildren(externalAccountsTableItems, externalAccountsTableColumns)
    },
    {
      key: TABLE.accountsWithStorage,
      label: t('accountsWithStorage'),
      tabContent: renderTabChildren(accountsWithStorageTableItems, accountsWithStorageTableColumns)
    },
    {
      key: TABLE.closedAccounts,
      label: t('closedAccounts'),
      tabContent: renderTabChildren(closedAccountsTableItems, closedAccountsTableColumns)
    }
  ];

  const options = views.map(view => ({ value: view.key, label: view.label }));
  const tabs = views.map(view => ({ key: view.key, children: view.tabContent }));

  return (
    <div className="UserAccountsTab">
      <div className="UserAccountsTab-header">
        <RadioGroup
          className="UserAccountsTab-tableSwitcher UserAccountsTab-tableSwitcher--wide"
          options={options}
          value={currentTable}
          onChange={event => setCurrentTable(event.target.value)}
          optionType="button"
          buttonStyle="solid"
          />
        <Select
          className="UserAccountsTab-tableSwitcher UserAccountsTab-tableSwitcher--narrow"
          options={options}
          value={currentTable}
          onChange={value => setCurrentTable(value)}
          />
        <Input
          className="UserAccountsTab-filter"
          value={filterText}
          onChange={event => setFilterText(event.target.value)}
          placeholder={t('filterPlaceholder')}
          prefix={<SearchOutlined />}
          allowClear
          />
      </div>
      <Tabs
        className="Tabs Tabs--smallPadding"
        activeKey={currentTable}
        disabled={isSaving}
        items={tabs}
        renderTabBar={() => null}
        />
    </div>
  );
}

export default UserAccountsTab;
