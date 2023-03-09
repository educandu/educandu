import by from 'thenby';
import routes from '../../utils/routes.js';
import Logger from '../../common/logger.js';
import UsedStorage from '../used-storage.js';
import { useUser } from '../user-context.js';
import FilterInput from '../filter-input.js';
import DeleteButton from '../delete-button.js';
import { useTranslation } from 'react-i18next';
import { ROLE } from '../../domain/constants.js';
import EditIcon from '../icons/general/edit-icon.js';
import { useDateFormat } from '../locale-context.js';
import CloseIcon from '../icons/general/close-icon.js';
import StoragePlanSelect from './storage-plan-select.js';
import { handleApiError } from '../../ui/error-helper.js';
import UserApiClient from '../../api-clients/user-api-client.js';
import RoomApiClient from '../../api-clients/room-api-client.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import RolesSelect, { ROLES_SELECT_DISPLAY } from './roles-select.js';
import StorageApiClient from '../../api-clients/storage-api-client.js';
import { Table, Tabs, Select, Radio, message, Tag, Modal } from 'antd';
import { confirmAllOwnedRoomsDelete } from '../confirmation-dialogs.js';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import UserAccountLockedStateEditor from './user-account-locked-state-editor.js';
import { ensureIsExcluded, ensureIsIncluded } from '../../utils/array-utils.js';

const logger = new Logger(import.meta.url);

const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

const TABLE = {
  activeAccounts: 'active-accounts',
  closedAccounts: 'closed-accounts',
  externalAccounts: 'external-accounts',
  unconfirmedAccounts: 'unconfirmed-accounts',
  accountsWithStorage: 'accounts-with-storage'
};

const BATCH_ACTION_TYPE = {
  assignRoles: 'assign-roles',
  assignStoragePlan: 'assign-storage-plan'
};

const DEFAULT_BATCH_ROLE = ROLE.user;
const DEFAULT_BATCH_ACTION_TYPE = BATCH_ACTION_TYPE.assignRoles;

function createTableItemSubsets(users, externalAccounts, storagePlans) {
  const accountTableItemsById = new Map();
  const storagePlansById = new Map(storagePlans.map(plan => [plan._id, plan]));

  const activeAccountsTableItems = [];
  const closedAccountsTableItems = [];
  const unconfirmedAccountsTableItems = [];
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
    } else if (user.expiresOn) {
      unconfirmedAccountsTableItems.push(accountTableItem);
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
    accountTableItemsById,
    activeAccountsTableItems,
    closedAccountsTableItems,
    unconfirmedAccountsTableItems,
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
  const executingUser = useUser();
  const { formatDate } = useDateFormat();
  const [users, setUsers] = useState([]);
  const { t } = useTranslation('userAccountsTab');
  const [isSaving, setIsSaving] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [storagePlans, setStoragePlans] = useState([]);
  const [usersById, setUsersById] = useState(new Map());
  const [isBatchSaving, setIsBatchSaving] = useState(false);
  const [externalAccounts, setExternalAccounts] = useState([]);
  const userApiClient = useSessionAwareApiClient(UserApiClient);
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);
  const [selectedAccountKeys, setSelectedAccountKeys] = useState([]);
  const storageApiClient = useSessionAwareApiClient(StorageApiClient);
  const [currentTable, setCurrentTable] = useState(TABLE.activeAccounts);
  const [accountTableItemsById, setAccountTableItemsById] = useState([]);
  const [currentBatchStoragePlan, setCurrentBatchStoragePlan] = useState(null);
  const [closedAccountsTableItems, setClosedAccountsTableItems] = useState([]);
  const [activeAccountsTableItems, setActiveAccountsTableItems] = useState([]);
  const [currentBatchRoles, setCurrentBatchRoles] = useState([DEFAULT_BATCH_ROLE]);
  const [externalAccountsTableItems, setExternalAccountsTableItems] = useState([]);
  const [unconfirmedAccountsTableItems, setPendingAccountsTableItems] = useState([]);
  const [isBatchProcessingModalOpen, setIsBatchProcessingModalOpen] = useState(false);
  const [accountsWithStorageTableItems, setAccountsWithStorageTableItems] = useState([]);
  const [currentBatchActionType, setCurrentBatchActionType] = useState(DEFAULT_BATCH_ACTION_TYPE);

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
    const tableItemSubsets = createTableItemSubsets(users, externalAccounts, storagePlans);

    setUsersById(new Map(users.map(user => [user._id, user])));
    setAccountTableItemsById(tableItemSubsets.accountTableItemsById);
    setActiveAccountsTableItems(filterTableItems(tableItemSubsets.activeAccountsTableItems, filterText));
    setClosedAccountsTableItems(filterTableItems(tableItemSubsets.closedAccountsTableItems, filterText));
    setExternalAccountsTableItems(filterTableItems(tableItemSubsets.externalAccountsTableItems, filterText));
    setSelectedAccountKeys(oldKeys => oldKeys.filter(key => tableItemSubsets.accountTableItemsById.has(key)));
    setPendingAccountsTableItems(filterTableItems(tableItemSubsets.unconfirmedAccountsTableItems, filterText));
    setAccountsWithStorageTableItems(filterTableItems(tableItemSubsets.accountsWithStorageTableItems, filterText));
  }, [users, externalAccounts, storagePlans, filterText]);

  const changeUserRole = async (userId, newRoles, isBatch) => {
    setIsSaving(true);
    setUsers(oldUsers => oldUsers.map(user => user._id === userId ? { ...user, roles: newRoles } : user));

    let errorThrown = null;
    try {
      await userApiClient.saveUserRoles({ userId, roles: newRoles });
      if (!isBatch) {
        message.success({ content: t('common:changesSavedSuccessfully') });
      }
    } catch (error) {
      errorThrown = error;
    } finally {
      setIsSaving(false);
    }

    if (errorThrown) {
      if (isBatch) {
        throw errorThrown;
      } else {
        handleApiError({ error: errorThrown, logger, t });
        refreshData();
      }
    }
  };

  const changeStoragePlan = async (userId, newStoragePlanId, isBatch) => {
    setIsSaving(true);
    setUsers(oldUsers => oldUsers.map(user => user._id === userId ? { ...user, storage: { ...user.storage, plan: newStoragePlanId } } : user));

    let errorThrown = null;
    try {
      const updatedStorage = await userApiClient.saveUserStoragePlan({ userId, storagePlanId: newStoragePlanId || null });
      setUsers(oldUsers => oldUsers.map(user => user._id === userId ? { ...user, storage: updatedStorage } : user));
      if (!isBatch) {
        message.success({ content: t('common:changesSavedSuccessfully') });
      }
    } catch (error) {
      errorThrown = error;
    } finally {
      setIsSaving(false);
    }

    if (errorThrown) {
      if (isBatch) {
        throw errorThrown;
      } else {
        handleApiError({ error: errorThrown, logger, t });
        refreshData();
      }
    }
  };

  const handleUserRolesChange = (userId, newRoles) => {
    return changeUserRole(userId, newRoles, false);
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

  const handleStoragePlanChange = (userId, newStoragePlanId) => {
    return changeStoragePlan(userId, newStoragePlanId);
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

  const handleProcessAllSelectedItems = () => {
    setCurrentBatchActionType(DEFAULT_BATCH_ACTION_TYPE);
    setCurrentBatchRoles([DEFAULT_BATCH_ROLE]);
    setCurrentBatchStoragePlan(null);
    setIsBatchProcessingModalOpen(true);
  };

  const handleCurrentBatchActionTypeChange = event => {
    const newBatchAction = event.target.value;
    setCurrentBatchActionType(newBatchAction);
    if (newBatchAction === BATCH_ACTION_TYPE.assignRoles) {
      setCurrentBatchStoragePlan(null);
    } else {
      setCurrentBatchRoles([DEFAULT_BATCH_ROLE]);
    }
  };

  const handleBatchProcessingModalCancel = () => {
    setIsBatchProcessingModalOpen(false);
  };

  const handleBatchProcessingModalOk = async () => {
    let actionExecutor;
    switch (currentBatchActionType) {
      case BATCH_ACTION_TYPE.assignRoles:
        actionExecutor = userId => {
          let newUserRoles = [...currentBatchRoles];
          if (userId === executingUser._id) {
            newUserRoles = ensureIsIncluded(newUserRoles, ROLE.admin);
          }
          changeUserRole(userId, newUserRoles, true);
        };
        break;
      case BATCH_ACTION_TYPE.assignStoragePlan:
        actionExecutor = userId => changeStoragePlan(userId, currentBatchStoragePlan, true);
        break;
      default:
        throw new Error(`Invalid batch action type ${currentBatchActionType}`);
    }

    try {
      setIsBatchSaving(true);
      for (const userId of selectedAccountKeys) {
        await actionExecutor(userId);
      }
      message.success({ content: t('common:changesSavedSuccessfully') });
      setIsBatchProcessingModalOpen(false);
    } catch (error) {
      handleApiError({ error, logger, t });
      refreshData();
    } finally {
      setIsBatchSaving(false);
    }
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
    return (
      <RolesSelect
        userId={item._id}
        value={item.roles}
        display={ROLES_SELECT_DISPLAY.inline}
        onChange={newRoles => handleUserRolesChange(item.key, newRoles)}
        />
    );
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
      <StoragePlanSelect
        storagePlans={storagePlans}
        value={item.storage.planId}
        onChange={newPlanId => handleStoragePlanChange(userId, newPlanId)}
        />
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
        <DeleteButton onClick={() => handleRemoveExternalAccountClick(externalAccountId)} />
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

  const activeAccountsTableColumns = [
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
      responsive: ['lg']
    }
  ];

  const unconfirmedAccountsTableColumns = [
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

  const renderTable = (dataSource, columns, allowSelection) => {
    const rowSelection = allowSelection
      ? {
        selectedRowKeys: selectedAccountKeys,
        onChange: setSelectedAccountKeys,
        preserveSelectedRowKeys: true
      }
      : null;

    return (
      <div className="Tabs-tabPane">
        <Table
          rowSelection={rowSelection}
          dataSource={dataSource}
          columns={columns}
          size="middle"
          loading={{ size: 'large', spinning: isLoading || isSaving, delay: 500 }}
          bordered
          />
      </div>
    );
  };

  const views = [
    {
      key: TABLE.activeAccounts,
      label: t('activeAccounts'),
      tabContent: renderTable(activeAccountsTableItems, activeAccountsTableColumns, true)
    },
    {
      key: TABLE.accountsWithStorage,
      label: t('accountsWithStorage'),
      tabContent: renderTable(accountsWithStorageTableItems, accountsWithStorageTableColumns, true)
    },
    {
      key: TABLE.unconfirmedAccounts,
      label: t('unconfirmedAccounts'),
      tabContent: renderTable(unconfirmedAccountsTableItems, unconfirmedAccountsTableColumns, false)
    },
    {
      key: TABLE.closedAccounts,
      label: t('closedAccounts'),
      tabContent: renderTable(closedAccountsTableItems, closedAccountsTableColumns, false)
    },
    {
      key: TABLE.externalAccounts,
      label: t('externalAccounts'),
      tabContent: renderTable(externalAccountsTableItems, externalAccountsTableColumns, false)
    }
  ];

  const options = views.map(view => ({ value: view.key, label: view.label }));
  const tabs = views.map(view => ({ key: view.key, children: view.tabContent }));

  return (
    <div className="UserAccountsTab">
      {!!selectedAccountKeys.length && (
        <div className="UserAccountsTab-selectedItems">
          {selectedAccountKeys.map(key => (
            <Tag
              key={key}
              closable
              closeIcon={<CloseIcon />}
              className="Tag Tag--selected"
              onClose={() => setSelectedAccountKeys(ensureIsExcluded(selectedAccountKeys, key))}
              >
              {accountTableItemsById.get(key).displayName}
            </Tag>
          ))}
          {!!selectedAccountKeys.length && (
          <a className="UserAccountsTab-selectedItemsLink" onClick={() => handleProcessAllSelectedItems()}>
            <EditIcon />
            <span>{t('processAll')}</span>
          </a>
          )}
          {selectedAccountKeys.length > 1 && (
          <a className="UserAccountsTab-selectedItemsLink" onClick={() => setSelectedAccountKeys([])}>
            <CloseIcon />
            <span>{t('common:removeAll')}</span>
          </a>
          )}
        </div>
      )}
      <div className="UserAccountsTab-tableHeader">
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
        <FilterInput
          value={filterText}
          className="UserAccountsTab-filter"
          onChange={event => setFilterText(event.target.value)}
          />
      </div>
      <Tabs
        className="Tabs Tabs--noPadding"
        activeKey={currentTable}
        disabled={isSaving}
        items={tabs}
        renderTabBar={() => null}
        />
      <Modal
        okText={t('processAll')}
        open={isBatchProcessingModalOpen}
        title={t('batchProcessingModalTitle')}
        okButtonProps={{ loading: isBatchSaving }}
        onOk={handleBatchProcessingModalOk}
        onCancel={handleBatchProcessingModalCancel}
        >
        <div className="UserAccountsTab-batchProcessingModalContent">
          <div className="UserAccountsTab-batchProcessingModalHeader">
            {t('batchProcessingModalHeader', { selectedItemCount: selectedAccountKeys.length })}
          </div>
          <RadioGroup
            className="UserAccountsTab-batchProcessingModalActionTypeRadioGroup"
            value={currentBatchActionType}
            onChange={handleCurrentBatchActionTypeChange}
            >
            <RadioButton value={BATCH_ACTION_TYPE.assignRoles}>{t('batchActionType_assignRoles')}</RadioButton>
            <RadioButton value={BATCH_ACTION_TYPE.assignStoragePlan}>{t('batchActionType_assignStoragePlan')}</RadioButton>
          </RadioGroup>
          {currentBatchActionType === BATCH_ACTION_TYPE.assignRoles && (
            <Fragment>
              <div className="UserAccountsTab-batchProcessingModalSelectHeader">
                {t('batchProcessingModalRolesSelectHeader', { selectedItemCount: selectedAccountKeys.length })}
              </div>
              <div className="UserAccountsTab-batchProcessingModalSelect">
                <RolesSelect
                  value={currentBatchRoles}
                  onChange={setCurrentBatchRoles}
                  />
              </div>
            </Fragment>
          )}
          {currentBatchActionType === BATCH_ACTION_TYPE.assignStoragePlan && (
            <Fragment>
              <div className="UserAccountsTab-batchProcessingModalSelectHeader">
                {t('batchProcessingModalStoragePlanSelectHeader', { selectedItemCount: selectedAccountKeys.length })}
              </div>
              <div className="UserAccountsTab-batchProcessingModalSelect">
                <StoragePlanSelect
                  storagePlans={storagePlans}
                  value={currentBatchStoragePlan}
                  onChange={setCurrentBatchStoragePlan}
                  />
              </div>
            </Fragment>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default UserAccountsTab;
