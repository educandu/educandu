const React = require('react');

const { useContext } = React;

const containerContext = React.createContext();

function useService(dependecy) {
  const container = useContext(containerContext);
  return container.get(dependecy);
}

function inject(dependencies, Component) {
  const createInjectedProps = container => Object.entries(dependencies).reduce((all, entry) => ({ ...all, [entry[0]]: container.get(entry[1]) }), {});

  return function InjectingComponent(props) {
    const container = useContext(containerContext);
    return <Component {...props} {...createInjectedProps(container)} />;
  };
}

module.exports = {
  ContainerProvider: containerContext.Provider,
  inject: inject,
  useService: useService
};
