import React from 'react';
import PropTypes from 'prop-types';
import { Container } from '../common/di.js';
import { UserProvider } from './user-context.js';
import { DialogProvider } from './dialog-context.js';
import { RequestProvider } from './request-context.js';
import { LocaleProvider } from './locale-context.js';
import { SettingsProvider } from './settings-context.js';
import { PageNameProvider } from './page-name-context.js';
import { useReloadPersistedWindow } from '../ui/hooks.js';
import { ContainerProvider } from './container-context.js';
import { userProps, requestProps, settingsProps, pageNameProps } from '../ui/default-prop-types.js';

function Root({
  request,
  user,
  container,
  initialState,
  settings,
  uiLanguage,
  pageName,
  PageComponent,
  PageTemplateComponent,
  SiteLogoComponent
}) {

  useReloadPersistedWindow();

  return (
    <ContainerProvider value={container}>
      <PageNameProvider value={pageName}>
        <LocaleProvider value={uiLanguage}>
          <SettingsProvider value={settings}>
            <RequestProvider value={request}>
              <UserProvider value={user}>
                <DialogProvider>
                  <PageComponent
                    initialState={initialState}
                    PageTemplate={PageTemplateComponent}
                    SiteLogo={SiteLogoComponent}
                    />
                </DialogProvider>
              </UserProvider>
            </RequestProvider>
          </SettingsProvider>
        </LocaleProvider>
      </PageNameProvider>
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
  /* eslint-disable-next-line react/forbid-prop-types */
  initialState: PropTypes.any,
  uiLanguage: PropTypes.string.isRequired
};

Root.defaultProps = {
  /* eslint-disable-next-line no-undefined */
  initialState: undefined
};

export default Root;
