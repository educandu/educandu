import React from 'react';
import gravatar from 'gravatar';
import PropTypes from 'prop-types';
import { Avatar, Tabs } from 'antd';
import NewsTab from '../news-tab.js';
import RoomsTab from '../rooms-tab.js';
import routes from '../../utils/routes.js';
import AccountTab from '../account-tab.js';
import ProfileTab from '../profile-tab.js';
import { useUser } from '../user-context.js';
import UsedStorage from '../used-storage.js';
import FavoritesTab from '../favorites-tab.js';
import { useTranslation } from 'react-i18next';
import { useRequest } from '../request-context.js';
import { useService } from '../container-context.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { useStoragePlan } from '../storage-plan-context.js';
import { invitationBasicShape, roomShape, userActivitiesShape } from '../../ui/default-prop-types.js';

const { TabPane } = Tabs;

const AVATAR_SIZE = 110;

function Dashboard({ initialState, PageTemplate }) {
  const user = useUser();
  const request = useRequest();
  const storagePlan = useStoragePlan();
  const { t } = useTranslation('dashboard');
  const clientConfig = useService(ClientConfig);

  const initialTab = request.query.tab || '';
  const { rooms, invitations, activities } = initialState;
  const gravatarUrl = gravatar.url(user.email, { s: AVATAR_SIZE, d: 'mp' });

  const personName = [user.profile?.firstName, user.profile?.lastName].filter(name => name).join(' ');
  const headerTitle = personName || user.username;
  const headerSubtitle = personName ? `${user.username} | ${user.email}` : user.email;

  const handleTabChange = tab => {
    history.replaceState(null, '', routes.getDashboardUrl({ tab }));
  };

  return (
    <PageTemplate disableProfileWarning>
      <div className="DashboardPage">

        <section className="DashboardPage-headerSection">
          <div className="DashboardPage-headerAvatar">
            <Avatar className="Avatar" shape="circle" size={AVATAR_SIZE} src={gravatarUrl} alt={user.username} />
          </div>
          <div>
            <span className="DashboardPage-headerTitle">{headerTitle}</span>
            <span className="DashboardPage-headerSubtitle">{headerSubtitle}</span>
          </div>
        </section>

        <Tabs className="Tabs" type="line" size="middle" defaultActiveKey={initialTab} onChange={handleTabChange}>
          <TabPane className="Tabs-tabPane" tab={t('newsTabTitle')} key="news">
            <NewsTab activities={activities} />
          </TabPane>
          <TabPane className="Tabs-tabPane" tab={t('favoritesTabTitle')} key="favorites">
            <FavoritesTab />
          </TabPane>
          {clientConfig.areRoomsEnabled && (
            <TabPane className="Tabs-tabPane" tab={t('roomsTabTitle')} key="rooms">
              <RoomsTab rooms={rooms} invitations={invitations} />
            </TabPane>)}
          <TabPane className="Tabs-tabPane" tab={t('profileTabTitle')} key="profile">
            <ProfileTab />
          </TabPane>
          <TabPane className="Tabs-tabPane" tab={t('accountTabTitle')} key="account">
            <AccountTab />
          </TabPane>
          {!!(user.storage.plan || user.storage.usedBytes) && (
            <TabPane className="Tabs-tabPane" tab={t('common:storage')} key="storage">
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
            </TabPane>
          )}
        </Tabs>

      </div>
    </PageTemplate>
  );
}

Dashboard.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    rooms: PropTypes.arrayOf(roomShape).isRequired,
    invitations: PropTypes.arrayOf(invitationBasicShape),
    activities: PropTypes.arrayOf(userActivitiesShape).isRequired
  }).isRequired
};

export default Dashboard;
