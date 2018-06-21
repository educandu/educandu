const RepositoryBrowser = require('./repository-browser.jsx');
const { ContainerProvider } = require('./container-context.jsx');
const { Container } = require('../common/di');
const PropTypes = require('prop-types');
const React = require('react');

function Page({ container, initialState, PageComponent }) {
  return (
    <ContainerProvider value={container}>
      <RepositoryBrowser rootPrefix="test" selectionMode="single" />
      <PageComponent initialState={initialState} />
    </ContainerProvider>
  );
}

Page.propTypes = {
  PageComponent: PropTypes.func.isRequired,
  container: PropTypes.instanceOf(Container).isRequired,
  /* eslint-disable-next-line react/forbid-prop-types */
  initialState: PropTypes.any
};

Page.defaultProps = {
  /* eslint-disable-next-line no-undefined */
  initialState: undefined
};

module.exports = Page;
