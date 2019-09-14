const { useMemo } = require('react');
const permissions = require('../domain/permissions');
const { useUser } = require('../components/user-context.jsx');

function usePermission(permissionToCheck) {
  const user = useUser();

  return useMemo(
    () => permissions.hasUserPermission(user, permissionToCheck),
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [permissionToCheck, ...user.roles]
  );
}

module.exports = {
  usePermission
};
