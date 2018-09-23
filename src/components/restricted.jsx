const PropTypes = require('prop-types');
const { withUser } = require('./user-context.jsx');
const permissions = require('../domain/permissions');
const { userProps } = require('../ui/default-prop-types');

function Restricted({ to, user, children }) {
  return permissions.hasUserPermission(user, to) ? children : null;
}

Restricted.propTypes = {
  ...userProps,
  children: PropTypes.node,
  to: PropTypes.string.isRequired
};

Restricted.defaultProps = {
  children: null
};

module.exports = withUser(Restricted);
