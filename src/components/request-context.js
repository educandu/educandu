import React, { useContext } from 'react';

const requestContext = React.createContext();

export const RequestProvider = requestContext.Provider;

export function useRequest() {
  return useContext(requestContext);
}

export function useIsFullscreenSupported() {
  const context = useContext(requestContext);
  const { isMobile, isSafari, version } = context.useragent;

  if (isMobile && isSafari) {
    const versionParts = version.split('.');
    const majorVersion = parseInt(versionParts[0], 10);
    const minorVersion = parseInt(versionParts[1], 10);

    return majorVersion > 17 || (majorVersion === 17 && minorVersion >= 2);
  }

  return true;
}

export function useIsIOS() {
  const context = useContext(requestContext);
  const { isiPhone, isiPad } = context.useragent;

  return isiPhone || isiPad;
}
