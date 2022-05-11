import React, { useContext } from 'react';

const settingsContext = React.createContext();

export const SettingsProvider = settingsContext.Provider;

export function useSettings() {
  return useContext(settingsContext);
}
