import React from 'react';
import PropTypes from 'prop-types';
import { Alert as AntdAlert } from 'antd';
import { InfoCircleFilled } from '@ant-design/icons';

function Alert({ className, message, description, closable, onClose, afterClose }) {
  return (
    <AntdAlert
      className={['Alert', className].filter(x => x).join(' ')}
      message={message}
      description={description}
      closable={closable}
      onClose={onClose}
      afterClose={afterClose}
      type="info"
      banner={false}
      icon={<InfoCircleFilled className="Alert-icon" />}
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
  onClose: PropTypes.func
};

Alert.defaultProps = {
  afterClose: () => {},
  className: null,
  closable: false,
  description: null,
  onClose: () => {}
};

export default Alert;
