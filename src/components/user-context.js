import PropTypes from 'prop-types';
import { userShape } from '../ui/default-prop-types.js';
import React, { useContext, useEffect, useMemo, useState } from 'react';

const UserContext = React.createContext();

export function useUser() {
  const { user } = useContext(UserContext);
  return user;
}

export function useSetUser() {
  const { setUser } = useContext(UserContext);
  return setUser;
}

export function withUser(Component) {
  return function UserInjector(props) {
    const user = useUser();
    return <Component {...props} user={user} />;
  };
}

export function UserProvider({ value, children }) {
  const [user, setUser] = useState(value);
  useEffect(() => setUser(value), [value]);
  const contextValue = useMemo(() => ({ user, setUser }), [user]);
  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

UserProvider.propTypes = {
  children: PropTypes.node,
  value: userShape
};

UserProvider.defaultProps = {
  children: null,
  value: null
};

export default {
  UserProvider,
  useUser,
  withUser
};
