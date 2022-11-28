import React from 'react';
import { Tooltip } from 'antd';
import PropTypes from 'prop-types';
import { InfoCircleOutlined } from '@ant-design/icons';

function Info({ children, iconAfterContent, tooltip }) {
  return (
    <span className="Info">
      {!!iconAfterContent && children}
      {!!tooltip && (
        <Tooltip title={tooltip}>
          <InfoCircleOutlined className="Info-icon Info-icon--help" />
        </Tooltip>
      )}
      {!tooltip && <InfoCircleOutlined className="Info-icon" />}
      {!iconAfterContent && children}
    </span>
  );
}

Info.propTypes = {
  children: PropTypes.node,
  iconAfterContent: PropTypes.bool,
  tooltip: PropTypes.node
};

Info.defaultProps = {
  children: null,
  iconAfterContent: false,
  tooltip: null
};

export default Info;