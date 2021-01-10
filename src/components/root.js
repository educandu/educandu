import React from 'react';
import PropTypes from 'prop-types';
import { Container } from '../common/di';
import { UserProvider } from './user-context';
import { RequestProvider } from './request-context';
import { LanguageProvider } from './language-context';
import { ContainerProvider } from './container-context';
import { requestProps, userProps } from '../ui/default-prop-types';

function Root({ request, user, container, initialState, language, PageComponent }) {
  return (
    <ContainerProvider value={container}>
      <LanguageProvider value={language}>
        <RequestProvider value={request}>
          <UserProvider value={user}>
            <PageComponent initialState={initialState} language={language} />
          </UserProvider>
        </RequestProvider>
      </LanguageProvider>
    </ContainerProvider>
  );
}

Root.propTypes = {
  ...requestProps,
  ...userProps,
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
