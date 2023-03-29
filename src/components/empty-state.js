import React from 'react';
import PropTypes from 'prop-types';
import { Button, Result } from 'antd';

function EmptyState({ icon, title, subtitle, action }) {

  const actions = [];

  if (action) {
    actions.push((
      <Button type="primary" key="action" icon={action.icon || null} onClick={event => action.onClick(event)}>
        {action.text}
      </Button>
    ));
  }

  return (
    <div className="EmptyState">
      <Result
        icon={icon}
        title={title}
        subTitle={subtitle}
        extra={actions}
        />
    </div>
  );
}

EmptyState.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  action: PropTypes.shape({
    text: PropTypes.string.isRequired,
    icon: PropTypes.node,
    onClick: PropTypes.func.isRequired
  })
};

EmptyState.defaultProps = {
  action: null
};

export default EmptyState;
