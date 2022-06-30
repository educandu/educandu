import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Alert as AntdAlert } from 'antd';
import WarningIcon from './icons/general/warning-icon.js';
import InformationIcon from './icons/general/information-icon.js';

export const ALERT_TYPE = {
  info: 'info',
  warning: 'warning'
};

const renderIcon = type => {
  let Icon;
  switch (type) {
    case ALERT_TYPE.warning:
      Icon = WarningIcon;
      break;
    case ALERT_TYPE.info:
    default:
      Icon = InformationIcon;
      break;
  }
  return <Icon className={`Alert-icon Alert-icon--${type}`} />;
};

function Alert({ className, message, description, type, closable, onClose, afterClose }) {
  return (
    <AntdAlert
      className={classNames('Alert', `Alert--${type}`, { [className]: !!className })}
      message={message}
      description={description}
      closable={closable}
      onClose={onClose}
      afterClose={afterClose}
      banner={false}
      type={type}
      icon={renderIcon(type)}
      showIcon
      />
  );
}

Alert.propTypes = {
  afterClose: PropTypes.func,
  className: PropTypes.string,
  closable: PropTypes.bool,
  description: PropTypes.node,
  message: PropTypes.node.isRequired,
  onClose: PropTypes.func,
  type: PropTypes.oneOf(Object.values(ALERT_TYPE))
};

Alert.defaultProps = {
  afterClose: () => {},
  className: null,
  closable: false,
  description: null,
  onClose: () => {},
  type: ALERT_TYPE.info
};

export default Alert;
