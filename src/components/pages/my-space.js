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
import ClientConfig from '../../bootstrap/client-config.js';
import { getGlobalAlerts } from '../../ui/global-alerts.js';
import { FEATURE_TOGGLES } from '../../common/constants.js';

const { TabPane } = Tabs;
function MySpace({ PageTemplate }) {
  const user = useUser();
  const pageName = usePageName();
  const { t } = useTranslation('mySpace');
  const clientConfig = useService(ClientConfig);

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
  const isRoomsTabEnabled = !clientConfig.disabledFeatures.includes(FEATURE_TOGGLES.rooms);

  return (
    <PageTemplate alerts={alerts} disableProfileWarning>
      <div className="MySpacePage">

        <h1>{t('pageNames:mySpace')}</h1>
        <Tabs className="MySpacePage-tabs" defaultActiveKey="1" type="card" size="large">
          <TabPane className="MySpacePage-tab" tab={t('profileTabTitle')} key="1">
            <ProfileTab formItemLayout={formItemLayout} tailFormItemLayout={tailFormItemLayout} />
          </TabPane>
          <TabPane className="MySpacePage-tab" tab={t('accountTabTitle')} key="2">
            <AccountTab formItemLayout={formItemLayout} tailFormItemLayout={tailFormItemLayout} />
          </TabPane>
          { isRoomsTabEnabled && (
            <TabPane className="MySpacePage-tab" tab={t('roomsTabTitle')} key="3">
              <RoomsTab />
            </TabPane>)}
        </Tabs>

      </div>
    </PageTemplate>
  );
}

MySpace.propTypes = {
  PageTemplate: PropTypes.func.isRequired
};

export default MySpace;
