import React from 'react';
import gravatar from 'gravatar';
import PropTypes from 'prop-types';
import { Avatar, Tabs } from 'antd';
import RoomsTab from '../rooms-tab.js';
import AccountTab from '../account-tab.js';
import ProfileTab from '../profile-tab.js';
import { useUser } from '../user-context.js';
import UsedStorage from '../used-storage.js';
import { useTranslation } from 'react-i18next';
import { useService } from '../container-context.js';
import { roomShape } from '../../ui/default-prop-types.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { useStoragePlan } from '../storage-plan-context.js';

const { TabPane } = Tabs;

const AVATAR_SIZE = 110;

function Dashboard({ initialState, PageTemplate }) {
  const user = useUser();
  const storagePlan = useStoragePlan();
  const { t } = useTranslation('dashboard');
  const clientConfig = useService(ClientConfig);

  const { rooms } = initialState;
  const gravatarUrl = gravatar.url(user.email, { s: AVATAR_SIZE, d: 'mp' });
  const storagePlanName = storagePlan ? `"${storagePlan.name}" ${t('storagePlanLabel')}` : t('noStoragePlanLabel');

  const formItemLayout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 8 }
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 16 }
    }
  };

  const tailFormItemLayout = {
    wrapperCol: {
      xs: {
        span: 24,
        offset: 0
      },
      sm: {
        span: 16,
        offset: 8
      }
    }
  };

  const personName = [user.profile?.firstName, user.profile?.lastName].filter(name => name).join(' ');
  const headerTitle = personName || user.username;
  const headerSubtitle = personName ? `${user.username} | ${user.email}` : user.email;

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

        <Tabs className="Tabs" defaultActiveKey="1" type="line" size="large">
          {clientConfig.areRoomsEnabled && (
            <TabPane className="Tabs-tabPane" tab={t('roomsTabTitle')} key="1">
              <RoomsTab rooms={rooms} />
            </TabPane>)}
          <TabPane className="Tabs-tabPane" tab={t('profileTabTitle')} key="2">
            <ProfileTab formItemLayout={formItemLayout} tailFormItemLayout={tailFormItemLayout} />
          </TabPane>
          <TabPane className="Tabs-tabPane" tab={t('accountTabTitle')} key="3">
            <AccountTab formItemLayout={formItemLayout} tailFormItemLayout={tailFormItemLayout} />
          </TabPane>
          {!!(user.storage.plan || user.storage.usedBytes) && (
            <TabPane className="Tabs-tabPane" tab={t('common:storage')} key="4">
              <h5>{storagePlanName}</h5>
              <div className="DashboardPage-usedStorage">
                <UsedStorage usedBytes={user.storage.usedBytes} maxBytes={storagePlan?.maxBytes} showLabel />
              </div>
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
    rooms: PropTypes.arrayOf(roomShape).isRequired
  }).isRequired
};

export default Dashboard;
