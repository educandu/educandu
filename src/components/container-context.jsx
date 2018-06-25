const { Container } = require('../common/di');
const PropTypes = require('prop-types');
const React = require('react');

const { Consumer, Provider } = React.createContext();

function inject(dependencies, Component) {
  const createInjectedProps = container => Object.entries(dependencies).reduce((all, entry) => ({ ...all, [entry[0]]: container.get(entry[1]) }), {});

  function InjectingComponent(props) {
    return (
      <Consumer>
        {container => <Component {...props} {...createInjectedProps(container)} />}
      </Consumer>
    );
  }

  InjectingComponent.propTypes = {
    container: PropTypes.instanceOf(Container)
  };

  InjectingComponent.defaultProps = {
    container: null
  };

  return InjectingComponent;
}

module.exports = {
  ContainerProvider: Provider,
  inject: inject
};
