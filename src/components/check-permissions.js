const PropTypes = require('prop-types');
const { withUser } = require('./user-context');
const { userProps } = require('../ui/default-prop-types');
const permissionsModule = require('../domain/permissions');

function CheckPermissions({ permissions, user, children }) {
  return Array.isArray(permissions)
    ? children(permissions.map(perm => permissionsModule.hasUserPermission(user, perm)))
    : children(permissionsModule.hasUserPermission(user, permissions));
}

CheckPermissions.propTypes = {
  ...userProps,
  children: PropTypes.func.isRequired,
  permissions: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string)
  ]).isRequired
};

module.exports = withUser(CheckPermissions);
