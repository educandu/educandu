import { useMemo } from 'react';
import { useUser } from '../components/user-context.js';
import { hasUserPermission } from '../domain/permissions.js';

export function usePermission(permissionToCheck) {
  const user = useUser();

  return useMemo(
    () => hasUserPermission(user, permissionToCheck),
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [permissionToCheck, ...user.roles]
  );
}

export default {
  usePermission
};
