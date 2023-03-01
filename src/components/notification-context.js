import PropTypes from 'prop-types';
import React, { useContext, useEffect, useMemo, useState } from 'react';

const NotificationContext = React.createContext();

export function useUnreadNotificationsCount() {
  const { unreadNotificationsCount } = useContext(NotificationContext);
  return unreadNotificationsCount;
}

export function useSetUnreadNotificationsCount() {
  const { setUnreadNotificationsCount } = useContext(NotificationContext);
  return setUnreadNotificationsCount;
}

export function NotificationProvider({ value, children }) {
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(value);
  useEffect(() => setUnreadNotificationsCount(value), [value]);
  const contextValue = useMemo(() => ({ unreadNotificationsCount, setUnreadNotificationsCount }), [unreadNotificationsCount]);
  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

NotificationProvider.propTypes = {
  children: PropTypes.node,
  value: PropTypes.number
};

NotificationProvider.defaultProps = {
  children: null,
  value: 0
};
