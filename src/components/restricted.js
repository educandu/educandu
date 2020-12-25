const PropTypes = require('prop-types');
const { withUser } = require('./user-context');
const permissions = require('../domain/permissions');
const { userProps } = require('../ui/default-prop-types');

function Restricted({ to, user, children }) {
  if (!to) {
    return children;
  }

  const permissionsToCheck = Array.isArray(to) ? to : [to];
  const allPermissionsGranted = permissionsToCheck.every(perm => permissions.hasUserPermission(user, perm));
  return allPermissionsGranted ? children : null;
}

Restricted.propTypes = {
  ...userProps,
  children: PropTypes.node,
  to: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string)
  ])
};

Restricted.defaultProps = {
  children: null
};

module.exports = withUser(Restricted);
