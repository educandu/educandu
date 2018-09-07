const React = require('react');
const PropTypes = require('prop-types');
const { Container } = require('../common/di');
const { UserProvider } = require('./user-context.jsx');
const { RequestProvider } = require('./request-context.jsx');
const { ContainerProvider } = require('./container-context.jsx');
const { requestProps, userProps } = require('../ui/default-prop-types');

/* eslint-disable-next-line no-warning-comments */
// TODO Create LanguageContext instead of injecting it directly into the page component?
function Root({ request, user, container, initialState, language, PageComponent }) {
  return (
    <RequestProvider value={request}>
      <UserProvider value={user}>
        <ContainerProvider value={container}>
          <PageComponent initialState={initialState} language={language} />
        </ContainerProvider>
      </UserProvider>
    </RequestProvider>
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

module.exports = Root;
