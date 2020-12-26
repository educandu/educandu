import { useMemo } from 'react';
import permissions from '../domain/permissions';
import { useUser } from '../components/user-context';

export function usePermission(permissionToCheck) {
  const user = useUser();

  return useMemo(
    () => permissions.hasUserPermission(user, permissionToCheck),
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [permissionToCheck, ...user.roles]
  );
}

export default {
  usePermission
};
