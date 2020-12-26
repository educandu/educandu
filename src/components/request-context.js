import React, { useContext } from 'react';

const requestContext = React.createContext();

export const RequestProvider = requestContext.Provider;

export function useRequest() {
  return useContext(requestContext);
}

export function withRequest(Component) {
  return function RequestInjector(props) {
    const request = useContext(requestContext);
    return <Component {...props} request={request} />;
  };
}

export default {
  RequestProvider,
  useRequest,
  withRequest
};
