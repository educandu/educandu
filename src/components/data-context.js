import React, { useContext } from 'react';

const dataContext = React.createContext();

export const DataProvider = dataContext.Provider;

export function withData(Component) {
  return function DataInjector(props) {
    const data = useContext(dataContext);
    return <Component {...props} data={data} />;
  };
}

export default {
  DataProvider,
  withData
};
