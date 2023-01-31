import { Tabs } from 'antd';
import PropTypes from 'prop-types';
import routes from '../../utils/routes.js';
import { useUser } from '../user-context.js';
import UsedStorage from '../used-storage.js';
import { useTranslation } from 'react-i18next';
import urlUtils from '../../utils/url-utils.js';
import RoomsTab from '../dashboard/rooms-tab.js';
import ProfileHeader from '../profile-header.js';
import { useRequest } from '../request-context.js';
import React, { useEffect, useState } from 'react';
import SettingsTab from '../dashboard/settings-tab.js';
import FavoritesTab from '../dashboard/favorites-tab.js';
import DocumentsTab from '../dashboard/documents-tab.js';
import ActivitiesTab from '../dashboard/activities-tab.js';
import { ROOM_USER_ROLE } from '../../domain/constants.js';
import { useStoragePlan } from '../storage-plan-context.js';
import UserApiClient from '../../api-clients/user-api-client.js';
import RoomApiClient from '../../api-clients/room-api-client.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import DocumentApiClient from '../../api-clients/document-api-client.js';

const TAB_KEYS = {
  activities: 'activities',
  favorites: 'favorites',
  documents: 'documents',
  rooms: 'rooms',
  storage: 'storage',
  settings: 'settings'
};

function Dashboard({ PageTemplate }) {
  const user = useUser();
  const request = useRequest();
  const storagePlan = useStoragePlan();
  const { t } = useTranslation('dashboard');
  const userApiClient = useSessionAwareApiClient(UserApiClient);
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);
  const documentApiClient = useSessionAwareApiClient(DocumentApiClient);

  const initialTab = request.query.tab || TAB_KEYS.activities;
  const gravatarUrl = urlUtils.getGravatarUrl(user.email);

  const [rooms, setRooms] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [fetchingRooms, setFetchingRooms] = useState(true);
  const [selectedTab, setSelectedTab] = useState(initialTab);
  const [fetchingDocuments, setFetchingDocuments] = useState(true);
  const [fetchingActivities, setFetchingActivities] = useState(true);

  useEffect(() => {
    if (selectedTab === TAB_KEYS.activities) {
      (async () => {
        setFetchingActivities(true);
        const response = await userApiClient.getActivities();
        setFetchingActivities(false);
        setActivities(response.activities);
      })();
    }

    if (selectedTab === TAB_KEYS.documents) {
      (async () => {
        setFetchingDocuments(true);
        const documentApiClientResponse = await documentApiClient.getDocumentsByContributingUser(user._id);
        setFetchingDocuments(false);

        setDocuments(documentApiClientResponse.documents);
      })();
    }

    if (selectedTab === TAB_KEYS.rooms) {
      (async () => {
        setFetchingRooms(true);
        const roomApiClientResponse = await roomApiClient.getRooms({ userRole: ROOM_USER_ROLE.ownerOrMember });
        const userApiClientResponse = await userApiClient.getRoomsInvitations();
        setFetchingRooms(false);

        setRooms(roomApiClientResponse.rooms);
        setInvitations(userApiClientResponse.invitations);
      })();
    }
  }, [user, selectedTab, userApiClient, documentApiClient, roomApiClient]);

  const handleTabChange = tab => {
    setSelectedTab(tab);
    history.replaceState(null, '', routes.getDashboardUrl({ tab }));
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
          <FavoritesTab />
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
    label: t('settingsTabTitle'),
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
