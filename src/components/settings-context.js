import React, { useContext } from 'react';

const settingsContext = React.createContext();

export const SettingsProvider = settingsContext.Provider;

export function useSettings() {
  return useContext(settingsContext);
}

export function withSettings(Component) {
  return function RequestInjector(props) {
    const settings = useContext(settingsContext);
    return <Component {...props} settings={settings} />;
  };
}

export default {
  SettingsProvider,
  useSettings,
  withSettings
};
