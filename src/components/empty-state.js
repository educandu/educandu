import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button, Result } from 'antd';

function EmptyState({ icon, title, subtitle, button, compact }) {

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
    <div className={classNames('EmptyState', { 'EmptyState--compact': compact })}>
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
  }),
  compact: PropTypes.bool
};

EmptyState.defaultProps = {
  icon: null,
  title: null,
  subtitle: null,
  button: null,
  compact: false
};

export default EmptyState;
