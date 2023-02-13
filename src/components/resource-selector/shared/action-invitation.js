import React from 'react';
import PropTypes from 'prop-types';

function ActionInvitation({ icon, title, subtitle }) {
  return (
    <div className="ActionInvitation">
      <div className="ActionInvitation-icon">{icon}</div>
      <div className="ActionInvitation-title">{title}</div>
      {!!subtitle && <div className="ActionInvitation-subtitle">{subtitle}</div>}
    </div>
  );
}

ActionInvitation.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.node.isRequired,
  subtitle: PropTypes.node
};

ActionInvitation.defaultProps = {
  subtitle: null
};

export default ActionInvitation;
