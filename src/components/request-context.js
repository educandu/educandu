import React, { useContext } from 'react';

const requestContext = React.createContext();

export const RequestProvider = requestContext.Provider;

export function useRequest() {
  return useContext(requestContext);
}
