import React from 'react';
import { Tooltip } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const ACTION_BUTTON_INTENT = {
  default: 'default',
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error'
};

export function ActionButtonGroup({ children }) {
  return <span className="ActionButtonGroup">{children}</span>;
}

ActionButtonGroup.propTypes = {
  children: PropTypes.node
};

ActionButtonGroup.defaultProps = {
  children: null
};

function ActionButton({ title, icon, onClick, intent, overlay }) {
  const classes = classNames({
    'ActionButton': true,
    'ActionButton--default': intent === ACTION_BUTTON_INTENT.default,
    'ActionButton--info': intent === ACTION_BUTTON_INTENT.info,
    'ActionButton--success': intent === ACTION_BUTTON_INTENT.success,
    'ActionButton--warning': intent === ACTION_BUTTON_INTENT.warning,
    'ActionButton--error': intent === ACTION_BUTTON_INTENT.error,
    'ActionButton--overlay': overlay
  });

  return (
    <Tooltip title={title}>
      <a className={classes} onClick={onClick}>
        {icon}
      </a>
    </Tooltip>
  );
}

ActionButton.propTypes = {
  icon: PropTypes.node,
  intent: PropTypes.oneOf(Object.values(ACTION_BUTTON_INTENT)),
  onClick: PropTypes.func,
  overlay: PropTypes.bool,
  title: PropTypes.string
};

ActionButton.defaultProps = {
  icon: null,
  intent: ACTION_BUTTON_INTENT.default,
  onClick: () => {},
  overlay: false,
  title: ''
};

export default ActionButton;
