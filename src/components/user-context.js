import React, { useContext } from 'react';

const userContext = React.createContext();

export const UserProvider = userContext.Provider;

export function useUser() {
  return useContext(userContext);
}

export function withUser(Component) {
  return function UserInjector(props) {
    const user = useContext(userContext);
    return <Component {...props} user={user} />;
  };
}

export default {
  UserProvider,
  useUser,
  withUser
};
