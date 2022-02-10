import React, { useContext } from 'react';

const pageNameContext = React.createContext();

export const PageNameProvider = pageNameContext.Provider;

export function usePageName() {
  return useContext(pageNameContext);
}

export default {
  PageNameProvider,
  usePageName
};
