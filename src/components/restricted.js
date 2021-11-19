import PropTypes from 'prop-types';
import { withUser } from './user-context.js';
import { userProps } from '../ui/default-prop-types.js';
import { hasUserPermission } from '../domain/permissions.js';

function Restricted({ to, user, children }) {
  if (!to) {
    return children;
  }

  const permissionsToCheck = Array.isArray(to) ? to : [to];
  const allPermissionsGranted = permissionsToCheck.every(perm => hasUserPermission(user, perm));
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

export default withUser(Restricted);
