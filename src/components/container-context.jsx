const React = require('react');

const { useContext } = React;

const containerContext = React.createContext();

function inject(dependencies, Component) {
  const createInjectedProps = container => Object.entries(dependencies).reduce((all, entry) => ({ ...all, [entry[0]]: container.get(entry[1]) }), {});

  return function InjectingComponent(props) {
    const container = useContext(containerContext);
    return <Component {...props} {...createInjectedProps(container)} />;
  };
}

module.exports = {
  ContainerProvider: containerContext.Provider,
  inject: inject
};
