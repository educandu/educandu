import React, { useContext } from 'react';

const containerContext = React.createContext();

export const ContainerProvider = containerContext.Provider;

export function useService(dependecy) {
  const container = useContext(containerContext);
  return container.get(dependecy);
}

export function inject(dependencies, Component) {
  const createInjectedProps = container => Object.entries(dependencies).reduce((all, entry) => ({ ...all, [entry[0]]: container.get(entry[1]) }), {});

  return function InjectingComponent(props) {
    const container = useContext(containerContext);
    return <Component {...props} {...createInjectedProps(container)} />;
  };
}

export default {
  ContainerProvider,
  useService,
  inject
};
