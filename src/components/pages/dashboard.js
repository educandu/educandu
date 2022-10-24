import React from 'react';
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
import { useService } from '../container-context.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { useStoragePlan } from '../storage-plan-context.js';
import { invitationBasicShape, roomShape, userActivitiesShape } from '../../ui/default-prop-types.js';

const { TabPane } = Tabs;

function Dashboard({ initialState, PageTemplate }) {
  const user = useUser();
  const request = useRequest();
  const storagePlan = useStoragePlan();
  const { t } = useTranslation('dashboard');
  const clientConfig = useService(ClientConfig);

  const initialTab = request.query.tab || '';
  const gravatarUrl = urlUtils.getGravatarUrl(user.email);
  const { rooms, invitations, activities } = initialState;

  const handleTabChange = tab => {
    history.replaceState(null, '', routes.getDashboardUrl({ tab }));
  };

  return (
    <PageTemplate>
      <div className="DashboardPage">
        <ProfileHeader
          email={user.email}
          avatarUrl={gravatarUrl}
          displayName={user.displayName}
          organization={user.organization}
          />

        <Tabs className="Tabs" type="line" size="middle" defaultActiveKey={initialTab} onChange={handleTabChange}>
          <TabPane className="Tabs-tabPane" tab={t('newsTabTitle')} key="news">
            <NewsTab activities={activities} />
          </TabPane>
          <TabPane className="Tabs-tabPane" tab={t('favoritesTabTitle')} key="favorites">
            <FavoritesTab />
          </TabPane>
          <TabPane className="Tabs-tabPane" tab={t('roomsTabTitle')} key="rooms">
            <RoomsTab rooms={rooms} invitations={invitations} />
          </TabPane>
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
