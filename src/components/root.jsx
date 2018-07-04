const React = require('react');
const PropTypes = require('prop-types');
const { Container } = require('../common/di');
const { ContainerProvider } = require('./container-context.jsx');

function Root({ container, initialState, PageComponent }) {
  return (
    <ContainerProvider value={container}>
      <PageComponent initialState={initialState} />
    </ContainerProvider>
  );
}

Root.propTypes = {
  PageComponent: PropTypes.func.isRequired,
  container: PropTypes.instanceOf(Container).isRequired,
  /* eslint-disable-next-line react/forbid-prop-types */
  initialState: PropTypes.any
};

Root.defaultProps = {
  /* eslint-disable-next-line no-undefined */
  initialState: undefined
};

module.exports = Root;
