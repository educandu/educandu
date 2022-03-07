import React from 'react';
import PropTypes from 'prop-types';
import { Alert as AntdAlert } from 'antd';
import { ALERT_TYPE } from '../domain/constants.js';
import { CheckCircleFilled, CloseCircleFilled, ExclamationCircleFilled, InfoCircleFilled } from '@ant-design/icons';

function Alert({ className, type, ...alertProps }) {
  let icon;
  switch (type) {
    case ALERT_TYPE.success:
      icon = <CheckCircleFilled className="Alert-icon" />;
      break;
    case ALERT_TYPE.info:
      icon = <InfoCircleFilled className="Alert-icon" />;
      break;
    case ALERT_TYPE.warning:
      icon = <ExclamationCircleFilled className="Alert-icon" />;
      break;
    case ALERT_TYPE.error:
      icon = <CloseCircleFilled className="Alert-icon" />;
      break;
    default:
      throw new Error(`Invalid alert type '${type}'`);
  }

  return (
    <AntdAlert
      className={['Alert', className].filter(x => x).join(' ')}
      {...alertProps}
      type={type}
      icon={icon}
      />
  );
}

Alert.propTypes = {
  className: PropTypes.string,
  icon: PropTypes.node,
  type: PropTypes.oneOf(Object.values(ALERT_TYPE))
};

Alert.defaultProps = {
  className: null,
  icon: null,
  type: ALERT_TYPE.info
};

export default Alert;
