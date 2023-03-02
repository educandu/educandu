import PropTypes from 'prop-types';
import React, { useContext, useEffect, useMemo, useState } from 'react';

const NotificationContext = React.createContext();

export function useNotificationsCount() {
  const { notificationsCount } = useContext(NotificationContext);
  return notificationsCount;
}

export function useSetNotificationsCount() {
  const { setNotificationsCount } = useContext(NotificationContext);
  return setNotificationsCount;
}

export function NotificationProvider({ value, children }) {
  const [notificationsCount, setNotificationsCount] = useState(value);
  useEffect(() => setNotificationsCount(value), [value]);
  const contextValue = useMemo(() => ({ notificationsCount, setNotificationsCount }), [notificationsCount]);
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
