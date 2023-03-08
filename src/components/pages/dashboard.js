import by from 'thenby';
import PropTypes from 'prop-types';
import routes from '../../utils/routes.js';
import { Badge, Tabs, Tooltip } from 'antd';
import { useUser } from '../user-context.js';
import UsedStorage from '../used-storage.js';
import { useTranslation } from 'react-i18next';
import urlUtils from '../../utils/url-utils.js';
import RoomsTab from '../dashboard/rooms-tab.js';
import ProfileHeader from '../profile-header.js';
import { useRequest } from '../request-context.js';
import SettingsTab from '../dashboard/settings-tab.js';
import FavoritesTab from '../dashboard/favorites-tab.js';
import DocumentsTab from '../dashboard/documents-tab.js';
import ActivitiesTab from '../dashboard/activities-tab.js';
import { useStoragePlan } from '../storage-plan-context.js';
import React, { useCallback, useEffect, useState } from 'react';
import UserApiClient from '../../api-clients/user-api-client.js';
import RoomApiClient from '../../api-clients/room-api-client.js';
import NotificationsTab from '../dashboard/notifications-tab.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import DocumentApiClient from '../../api-clients/document-api-client.js';
import { FAVORITE_TYPE, ROOM_USER_ROLE } from '../../domain/constants.js';
import NotificationsApiClient from '../../api-clients/notifications-api-client.js';
import { useNotificationsCount, useSetNotificationsCount } from '../notification-context.js';

const TAB_KEYS = {
  activities: 'activities',
  favorites: 'favorites',
  documents: 'documents',
  rooms: 'rooms',
  notifications: 'notifications',
  storage: 'storage',
  settings: 'settings'
};

function Dashboard({ PageTemplate }) {
  const user = useUser();
  const request = useRequest();
  const storagePlan = useStoragePlan();
  const { t } = useTranslation('dashboard');
  const notificationsCount = useNotificationsCount();
  const setNotificationsCount = useSetNotificationsCount();
  const userApiClient = useSessionAwareApiClient(UserApiClient);
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);
  const documentApiClient = useSessionAwareApiClient(DocumentApiClient);
  const notificationsApiClient = useSessionAwareApiClient(NotificationsApiClient);

  const initialTab = request.query.tab || TAB_KEYS.activities;
  const gravatarUrl = urlUtils.getGravatarUrl(user.email);

  const [rooms, setRooms] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [favoriteUsers, setFavoriteUsers] = useState([]);
  const [favoriteRooms, setFavoriteRooms] = useState([]);
  const [fetchingRooms, setFetchingRooms] = useState(true);
  const [selectedTab, setSelectedTab] = useState(initialTab);
  const [favoriteDocuments, setFavoriteDocuments] = useState([]);
  const [notificationGroups, setNotificationGroups] = useState([]);
  const [fetchingFavorites, setFetchingFavorites] = useState(true);
  const [fetchingDocuments, setFetchingDocuments] = useState(true);
  const [fetchingActivities, setFetchingActivities] = useState(true);
  const [fetchingNotificationGroups, setFetchingNotificationGroups] = useState(true);

  const fetchActivities = useCallback(async () => {
    try {
      setFetchingActivities(true);
      const response = await userApiClient.getActivities();
      setActivities(response.activities);
    } finally {
      setFetchingActivities(false);
    }
  }, [userApiClient]);

  const fetchNotifications = useCallback(async () => {
    try {
      setFetchingNotificationGroups(true);
      const response = await notificationsApiClient.getNotificationGroups();
      setNotificationGroups(response.notificationGroups);
    } finally {
      setFetchingNotificationGroups(false);
    }
  }, [notificationsApiClient]);

  const fetchFavorites = useCallback(async () => {
    try {
      setFetchingFavorites(true);
      const response = await userApiClient.getFavorites();
      const sortedFavorites = response.favorites.sort(by(f => f.setOn, 'desc'));
      setFavoriteUsers(sortedFavorites.filter(favorite => favorite.type === FAVORITE_TYPE.user));
      setFavoriteRooms(sortedFavorites.filter(favorite => favorite.type === FAVORITE_TYPE.room));
      setFavoriteDocuments(sortedFavorites.filter(favorite => favorite.type === FAVORITE_TYPE.document));
    } finally {
      setFetchingFavorites(false);
    }
  }, [userApiClient]);

  const fetchDocuments = useCallback(async () => {
    try {
      setFetchingDocuments(true);
      const documentApiClientResponse = await documentApiClient.getPublicNonArchivedDocumentsByContributingUser(user._id);
      setDocuments(documentApiClientResponse.documents);
    } finally {
      setFetchingDocuments(false);
    }
  }, [user, documentApiClient]);

  const fetchRooms = useCallback(async () => {
    try {
      setFetchingRooms(true);
      const roomApiClientResponse = await roomApiClient.getRooms({ userRole: ROOM_USER_ROLE.ownerOrMember });
      const userApiClientResponse = await userApiClient.getRoomsInvitations();
      setRooms(roomApiClientResponse.rooms);
      setInvitations(userApiClientResponse.invitations);
    } finally {
      setFetchingRooms(false);
    }
  }, [roomApiClient, userApiClient]);

  useEffect(() => {
    (async () => {
      switch (selectedTab) {
        case TAB_KEYS.activities:
          await fetchActivities();
          break;
        case TAB_KEYS.favorites:
          await fetchFavorites();
          break;
        case TAB_KEYS.documents:
          await fetchDocuments();
          break;
        case TAB_KEYS.rooms:
          await fetchRooms();
          break;
        case TAB_KEYS.notifications:
          await fetchNotifications();
          break;
        default:
          break;
      }
    })();
  }, [selectedTab, fetchActivities, fetchFavorites, fetchDocuments, fetchRooms, fetchNotifications]);

  const handleTabChange = tab => {
    setSelectedTab(tab);
    history.replaceState(null, '', routes.getDashboardUrl({ tab }));
  };

  const handleAddFavorite = async (type, id) => {
    await userApiClient.addFavorite({ type, id });
  };

  const handleRemoveFavorite = async (type, id) => {
    await userApiClient.removeFavorite({ type, id });
  };

  const handleRemoveNotificationGroup = async notificationGroup => {
    const response = await notificationsApiClient.removeNotifications(notificationGroup.notificationIds);
    setNotificationGroups(response.notificationGroups);
    setNotificationsCount(response.notificationGroups.length);
  };

  const handleRemoveNotifications = async () => {
    const notificationIds = notificationGroups.map(group => group.notificationIds).flat();
    const response = await notificationsApiClient.removeNotifications(notificationIds);
    setNotificationGroups(response.notificationGroups);
    setNotificationsCount(response.notificationGroups.length);
  };

  const items = [
    {
      key: TAB_KEYS.activities,
      label: t('activitiesTabTitle'),
      children: (
        <div className="Tabs-tabPane">
          <ActivitiesTab activities={activities} loading={fetchingActivities} />
        </div>
      )
    },
    {
      key: TAB_KEYS.favorites,
      label: t('favoritesTabTitle'),
      children: (
        <div className="Tabs-tabPane">
          <FavoritesTab
            favoriteUsers={favoriteUsers}
            favoriteRooms={favoriteRooms}
            favoriteDocuments={favoriteDocuments}
            loading={fetchingFavorites}
            onAddFavorite={handleAddFavorite}
            onRemoveFavorite={handleRemoveFavorite}
            />
        </div>
      )
    },
    {
      key: TAB_KEYS.documents,
      label: t('documentsTabTitle'),
      children: (
        <div className="Tabs-tabPane">
          <DocumentsTab documents={documents} loading={fetchingDocuments} />
        </div>
      )
    },
    {
      key: TAB_KEYS.rooms,
      label: t('roomsTabTitle'),
      children: (
        <div className="Tabs-tabPane">
          <RoomsTab rooms={rooms} invitations={invitations} loading={fetchingRooms} />
        </div>
      )
    },
    {
      key: TAB_KEYS.notifications,
      label: (
        <Tooltip title={notificationsCount ? t('common:notificationsTooltip', { count: notificationsCount }) : null}>
          <Badge dot title="" offset={[5, 0]} count={notificationsCount}>
            {t('common:notifications')}
          </Badge>
        </Tooltip>
      ),
      children: (
        <div className="Tabs-tabPane">
          <NotificationsTab
            loading={fetchingNotificationGroups}
            notificationGroups={notificationGroups}
            onRemoveNotificationGroup={handleRemoveNotificationGroup}
            onRemoveNotifications={handleRemoveNotifications}
            />
        </div>
      )
    }
  ];

  if (user.storage.plan || user.storage.usedBytes) {
    items.push({
      key: TAB_KEYS.storage,
      label: t('common:storage'),
      children: (
        <div className="Tabs-tabPane">
          <div className="DashboardPage-tabInfo">{t('storageTabInfo')}</div>
          <div className="DashboardPage-storageTabTitle">{t('storageTabTitle')}</div>
          <section className="DashboardPage-storageTabContent">
            <div className="DashboardPage-storageTabPlanName">
              {!!storagePlan && `${t('common:name')}: "${storagePlan.name}"`}
              {!storagePlan && t('noStoragePlan')}
            </div>
            <div className="DashboardPage-storageTabUsedStorage">
              <UsedStorage usedBytes={user.storage.usedBytes} maxBytes={storagePlan?.maxBytes} showLabel />
            </div>
          </section>
        </div>
      )
    });
  }

  items.push({
    key: TAB_KEYS.settings,
    label: t('common:settings'),
    children: (
      <div className="Tabs-tabPane">
        <SettingsTab />
      </div>
    )
  });

  return (
    <PageTemplate>
      <div className="DashboardPage">
        <ProfileHeader
          email={user.email}
          avatarUrl={gravatarUrl}
          displayName={user.displayName}
          organization={user.organization}
          />
        <Tabs
          className="Tabs"
          type="line"
          size="middle"
          defaultActiveKey={initialTab}
          onChange={handleTabChange}
          items={items}
          />
      </div>
    </PageTemplate>
  );
}

Dashboard.propTypes = {
  PageTemplate: PropTypes.func.isRequired
};

export default Dashboard;
