import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Alert as AntdAlert } from 'antd';
import AlertIcon from './icons/general/alert-icon.js';
import WarningIcon from './icons/general/warning-icon.js';
import InformationIcon from './icons/general/information-icon.js';
import ConfirmationIcon from './icons/general/confirmation-icon.js';

export const ALERT_TYPE = {
  success: 'success',
  info: 'info',
  warning: 'warning',
  error: 'error'
};

const renderIcon = type => {
  let Icon;
  switch (type) {
    case ALERT_TYPE.success:
      Icon = ConfirmationIcon;
      break;
    case ALERT_TYPE.warning:
      Icon = WarningIcon;
      break;
    case ALERT_TYPE.error:
      Icon = AlertIcon;
      break;
    case ALERT_TYPE.info:
    default:
      Icon = InformationIcon;
      break;
  }

  return <Icon className="CustomAlert-icon" />;
};

function CustomAlert({ className, message, description, type, closable, banner, onClose, afterClose }) {
  const classes = classNames(
    'CustomAlert',
    `CustomAlert--${type}`,
    { 'CustomAlert--banner': !!banner },
    { [className]: !!className }
  );

  return (
    <AntdAlert
      className={classes}
      message={message}
      description={description}
      closable={closable}
      onClose={onClose}
      afterClose={afterClose}
      banner={banner}
      icon={renderIcon(type)}
      showIcon
      />
  );
}

CustomAlert.propTypes = {
  afterClose: PropTypes.func,
  banner: PropTypes.bool,
  className: PropTypes.string,
  closable: PropTypes.bool,
  description: PropTypes.node,
  message: PropTypes.node.isRequired,
  onClose: PropTypes.func,
  type: PropTypes.oneOf(Object.values(ALERT_TYPE))
};

CustomAlert.defaultProps = {
  afterClose: () => {},
  banner: false,
  className: null,
  closable: false,
  description: null,
  onClose: () => {},
  type: ALERT_TYPE.info
};

export default CustomAlert;
