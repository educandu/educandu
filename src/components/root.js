import React from 'react';
import PropTypes from 'prop-types';
import { Container } from '../common/di';
import { UserProvider } from './user-context';
import { RequestProvider } from './request-context';
import { LanguageProvider } from './language-context';
import { SettingsProvider } from './settings-context';
import { ContainerProvider } from './container-context';
import { userProps, requestProps, settingsProps } from '../ui/default-prop-types';

function Root({ request, user, container, initialState, settings, language, PageComponent }) {
  return (
    <ContainerProvider value={container}>
      <LanguageProvider value={language}>
        <SettingsProvider value={settings}>
          <RequestProvider value={request}>
            <UserProvider value={user}>
              <PageComponent initialState={initialState} />
            </UserProvider>
          </RequestProvider>
        </SettingsProvider>
      </LanguageProvider>
    </ContainerProvider>
  );
}

Root.propTypes = {
  ...userProps,
  ...requestProps,
  ...settingsProps,
  PageComponent: PropTypes.func.isRequired,
  container: PropTypes.instanceOf(Container).isRequired,
  /* eslint-disable-next-line react/forbid-prop-types */
  initialState: PropTypes.any,
  language: PropTypes.string.isRequired
};

Root.defaultProps = {
  /* eslint-disable-next-line no-undefined */
  initialState: undefined
};

export default Root;
