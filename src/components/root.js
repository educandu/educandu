import React from 'react';
import PropTypes from 'prop-types';
import { ConfigProvider } from 'antd';
import { Container } from '../common/di.js';
import { UserProvider } from './user-context.js';
import { DialogProvider } from './dialog-context.js';
import { LocaleProvider } from './locale-context.js';
import { RequestProvider } from './request-context.js';
import { SettingsProvider } from './settings-context.js';
import { PageNameProvider } from './page-name-context.js';
import { useReloadPersistedWindow } from '../ui/hooks.js';
import { ContainerProvider } from './container-context.js';
import { NotificationProvider } from './notification-context.js';
import { userProps, requestProps, settingsProps, pageNameProps } from '../ui/default-prop-types.js';

function Root({
  request,
  user,
  notificationsCount,
  container,
  initialState,
  theme,
  settings,
  uiLanguage,
  pageName,
  PageComponent,
  PageTemplateComponent,
  HomePageTemplateComponent,
  SiteLogoComponent
}) {

  useReloadPersistedWindow();

  return (
    <ContainerProvider value={container}>
      <ConfigProvider theme={theme}>
        <PageNameProvider value={pageName}>
          <LocaleProvider value={uiLanguage}>
            <SettingsProvider value={settings}>
              <RequestProvider value={request}>
                <UserProvider value={user}>
                  <NotificationProvider value={notificationsCount}>
                    <DialogProvider>
                      <PageComponent
                        initialState={initialState}
                        PageTemplate={PageTemplateComponent}
                        HomePageTemplate={HomePageTemplateComponent}
                        SiteLogo={SiteLogoComponent}
                        />
                    </DialogProvider>
                  </NotificationProvider>
                </UserProvider>
              </RequestProvider>
            </SettingsProvider>
          </LocaleProvider>
        </PageNameProvider>
      </ConfigProvider>
    </ContainerProvider>
  );
}

Root.propTypes = {
  ...userProps,
  ...requestProps,
  ...settingsProps,
  ...pageNameProps,
  PageComponent: PropTypes.func.isRequired,
  PageTemplateComponent: PropTypes.func.isRequired,
  container: PropTypes.instanceOf(Container).isRequired,
  initialState: PropTypes.any,
  theme: PropTypes.any.isRequired,
  uiLanguage: PropTypes.string.isRequired
};

Root.defaultProps = {
  initialState: null
};

export default Root;
