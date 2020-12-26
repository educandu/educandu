import PropTypes from 'prop-types';
import { withUser } from './user-context';
import { userProps } from '../ui/default-prop-types';
import { hasUserPermission } from '../domain/permissions';

function CheckPermissions({ permissions, user, children }) {
  return Array.isArray(permissions)
    ? children(permissions.map(perm => hasUserPermission(user, perm)))
    : children(hasUserPermission(user, permissions));
}

CheckPermissions.propTypes = {
  ...userProps,
  children: PropTypes.func.isRequired,
  permissions: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string)
  ]).isRequired
};

export default withUser(CheckPermissions);
