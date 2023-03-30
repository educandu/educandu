import React from 'react';
import PropTypes from 'prop-types';
import { Button, Result } from 'antd';

function EmptyState({ icon, title, subtitle, button }) {

  const actions = [];

  if (button) {
    actions.push((
      <Button
        key="button"
        type={button.isDefaultType ? 'default' : 'primary'}
        icon={button.icon || null}
        onClick={event => button.onClick(event)}
        >
        {button.text}
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
  icon: PropTypes.node,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  button: PropTypes.shape({
    icon: PropTypes.node,
    text: PropTypes.string.isRequired,
    isDefaultType: PropTypes.bool,
    onClick: PropTypes.func.isRequired
  })
};

EmptyState.defaultProps = {
  icon: null,
  title: null,
  subtitle: null,
  button: null
};

export default EmptyState;
