import PropTypes from 'prop-types';
import React, { useContext, useEffect, useMemo, useState } from 'react';

const StorageContext = React.createContext();

export function useStorage() {
  const { storage } = useContext(StorageContext);
  return storage;
}

export function useSetStorage() {
  const { setStorage } = useContext(StorageContext);
  return setStorage;
}

export function StorageProvider({ value, children }) {
  const [storage, setStorage] = useState(value);
  useEffect(() => setStorage(value), [value]);
  const contextValue = useMemo(() => ({ storage, setStorage }), [storage]);
  return (
    <StorageContext.Provider value={contextValue}>
      {children}
    </StorageContext.Provider>
  );
}

StorageProvider.propTypes = {
  children: PropTypes.node,
  value: PropTypes.shape({
    usedBytes: PropTypes.number,
    maxBytes: PropTypes.number,
    path: PropTypes.string.isRequired,
    isDeletionEnabled: PropTypes.bool.isRequired
  })
};

StorageProvider.defaultProps = {
  children: null,
  value: null
};
