import React from 'react';
import { Tabs } from 'antd';
import PropTypes from 'prop-types';
import RoomsTab from '../rooms-tab.js';
import ProfileTab from '../profile-tab.js';
import AccountTab from '../account-tab.js';
import { useUser } from '../user-context.js';
import { useTranslation } from 'react-i18next';
import { useService } from '../container-context.js';
import { usePageName } from '../page-name-context.js';
import { roomShape } from '../../ui/default-prop-types.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { getGlobalAlerts } from '../../ui/global-alerts.js';

const { TabPane } = Tabs;

function MySpace({ initialState, PageTemplate }) {
  const user = useUser();
  const pageName = usePageName();
  const { t } = useTranslation('mySpace');
  const clientConfig = useService(ClientConfig);

  const { rooms } = initialState;

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

  const alerts = getGlobalAlerts(pageName, user);
  const isRoomsTabEnabled = clientConfig.areRoomsEnabled;

  return (
    <PageTemplate alerts={alerts} disableProfileWarning>
      <div className="MySpacePage">

        <h1>{t('pageNames:mySpace')}</h1>
        <Tabs className="Tabs" defaultActiveKey="1" type="line" size="large">
          <TabPane className="Tabs-tabPane" tab={t('profileTabTitle')} key="1">
            <ProfileTab formItemLayout={formItemLayout} tailFormItemLayout={tailFormItemLayout} />
          </TabPane>
          <TabPane className="Tabs-tabPane" tab={t('accountTabTitle')} key="2">
            <AccountTab formItemLayout={formItemLayout} tailFormItemLayout={tailFormItemLayout} />
          </TabPane>
          { isRoomsTabEnabled && (
            <TabPane className="Tabs-tabPane" tab={t('roomsTabTitle')} key="3">
              <RoomsTab rooms={rooms} />
            </TabPane>)}
        </Tabs>

      </div>
    </PageTemplate>
  );
}

MySpace.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    rooms: PropTypes.arrayOf(roomShape).isRequired
  }).isRequired
};

export default MySpace;
