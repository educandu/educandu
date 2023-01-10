import { Tabs } from 'antd';
import PropTypes from 'prop-types';
import NewsTab from '../news-tab.js';
import RoomsTab from '../rooms-tab.js';
import routes from '../../utils/routes.js';
import AccountTab from '../account-tab.js';
import ProfileTab from '../profile-tab.js';
import { useUser } from '../user-context.js';
import UsedStorage from '../used-storage.js';
import FavoritesTab from '../favorites-tab.js';
import { useTranslation } from 'react-i18next';
import urlUtils from '../../utils/url-utils.js';
import ProfileHeader from '../profile-header.js';
import { useRequest } from '../request-context.js';
import React, { useEffect, useState } from 'react';
import { ROOM_USER_ROLE } from '../../domain/constants.js';
import { useStoragePlan } from '../storage-plan-context.js';
import UserApiClient from '../../api-clients/user-api-client.js';
import RoomApiClient from '../../api-clients/room-api-client.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';

const TAB_KEYS = {
  news: 'news',
  favorites: 'favorites',
  rooms: 'rooms',
  profile: 'profile',
  account: 'account',
  storage: 'storage'
};

function Dashboard({ PageTemplate }) {
  const user = useUser();
  const request = useRequest();
  const storagePlan = useStoragePlan();
  const { t } = useTranslation('dashboard');

  const initialTab = request.query.tab || TAB_KEYS.news;

  const [rooms, setRooms] = useState([]);
  const [activities, setActivities] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const gravatarUrl = urlUtils.getGravatarUrl(user.email);
  const [selectedTab, setSelectedTab] = useState(initialTab);
  const userApiClient = useSessionAwareApiClient(UserApiClient);
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);

  useEffect(() => {
    if (selectedTab === TAB_KEYS.news) {
      (async () => {
        const response = await userApiClient.getActivities();
        setActivities(response.activities);
      })();
    }

    if (selectedTab === TAB_KEYS.rooms) {
      (async () => {
        const roomApiClientResponse = await roomApiClient.getRooms({ userRole: ROOM_USER_ROLE.ownerOrMember });
        const userApiClientResponse = await userApiClient.getRoomsInvitations();

        setRooms(roomApiClientResponse.rooms);
        setInvitations(userApiClientResponse.invitations);
      })();
    }
  }, [selectedTab, userApiClient, roomApiClient]);

  const handleTabChange = tab => {
    setSelectedTab(tab);
    history.replaceState(null, '', routes.getDashboardUrl({ tab }));
  };

  const items = [
    {
      key: TAB_KEYS.news,
      label: t('newsTabTitle'),
      children: (
        <div className="Tabs-tabPane">
          <NewsTab activities={activities} />
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
      key: TAB_KEYS.rooms,
      label: t('roomsTabTitle'),
      children: (
        <div className="Tabs-tabPane">
          <RoomsTab rooms={rooms} invitations={invitations} />
        </div>
      )
    },
    {
      key: TAB_KEYS.profile,
      label: t('profileTabTitle'),
      children: (
        <div className="Tabs-tabPane">
          <ProfileTab />
        </div>
      )
    },
    {
      key: TAB_KEYS.account,
      label: t('accountTabTitle'),
      children: (
        <div className="Tabs-tabPane">
          <AccountTab />
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
