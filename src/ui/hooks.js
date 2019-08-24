const { useMemo } = require('react');
const permissions = require('../domain/permissions');
const { useUser } = require('../components/user-context.jsx');

function createMemoKey(user, permissionToCheck) {
  return [permissionToCheck, ...user.roles];
}

function usePermission(permissionToCheck) {
  const user = useUser();
  return useMemo(() => {
    return permissions.hasUserPermission(user, permissionToCheck);
  }, createMemoKey(user, permissionToCheck));

}

module.exports = {
  usePermission
};
