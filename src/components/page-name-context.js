import React, { useContext } from 'react';

const pageNameContext = React.createContext();

export const PageNameProvider = pageNameContext.Provider;

export function usePageName() {
  return useContext(pageNameContext);
}

export function withPageName(Component) {
  return function RequestInjector(props) {
    const pageName = useContext(pageNameContext);
    return <Component {...props} pageName={pageName} />;
  };
}

export default {
  PageNameProvider,
  usePageName,
  withPageName
};
