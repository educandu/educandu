import { useMemo, useEffect } from 'react';
import { useUser } from '../components/user-context.js';
import { hasUserPermission } from '../domain/permissions.js';

export function usePermission(permissionToCheck) {
  const user = useUser();

  return useMemo(
    () => hasUserPermission(user, permissionToCheck),
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [permissionToCheck, ...user?.roles || []]
  );
}

export function useReloadPersistedWindow() {
  const handlePageShow = event => {
    if (event.persisted) {
      window.location.reload(true);
    }
  };

  useEffect(() => {
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);
}

export default {
  usePermission,
  useReloadPersistedWindow
};
