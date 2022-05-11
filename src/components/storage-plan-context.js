import React, { useContext } from 'react';

const storagePlanContext = React.createContext();

export const StoragePlanProvider = storagePlanContext.Provider;

export function useStoragePlan() {
  return useContext(storagePlanContext);
}
