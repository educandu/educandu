import React, { useContext } from 'react';

const containerContext = React.createContext();

export const ContainerProvider = containerContext.Provider;

export function useService(dependecy) {
  const container = useContext(containerContext);
  return container.get(dependecy);
}

export default {
  ContainerProvider,
  useService
};
