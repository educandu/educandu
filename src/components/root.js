import React from 'react';
import PropTypes from 'prop-types';
import { Container } from '../common/di';
import { UserProvider } from './user-context';
import { DataProvider } from './data-context';
import { RequestProvider } from './request-context';
import { ContainerProvider } from './container-context';
import { requestProps, userProps, dataProps } from '../ui/default-prop-types';

/* eslint-disable-next-line no-warning-comments */
// TODO Create LanguageContext instead of injecting it directly into the page component?
function Root({ request, user, data, container, initialState, language, PageComponent }) {
  return (
    <RequestProvider value={request}>
      <UserProvider value={user}>
        <DataProvider value={data}>
          <ContainerProvider value={container}>
            <PageComponent initialState={initialState} language={language} />
          </ContainerProvider>
        </DataProvider>
      </UserProvider>
    </RequestProvider>
  );
}

Root.propTypes = {
  ...requestProps,
  ...userProps,
  ...dataProps,
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
