import React from 'react';
import { Tooltip } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { InfoCircleOutlined } from '@ant-design/icons';

function Info({ children, iconAfterContent, tooltip, onIconClick }) {
  const icon = (
    <InfoCircleOutlined
      className={
        classNames({
          'Info-icon': true,
          'Info-icon--clickable': !!onIconClick,
          'Info-icon--help': !!tooltip && !onIconClick,
          'Info-icon--afterContent': !!tooltip && iconAfterContent
        })
      }
      onClick={onIconClick}
      />
  );
  return (
    <span className="Info">
      {!!iconAfterContent && children}
      {tooltip ? <Tooltip title={tooltip}>{icon}</Tooltip> : icon}
      {!iconAfterContent && children}
    </span>
  );
}

Info.propTypes = {
  children: PropTypes.node,
  iconAfterContent: PropTypes.bool,
  tooltip: PropTypes.node,
  onIconClick: PropTypes.func
};

Info.defaultProps = {
  children: null,
  iconAfterContent: false,
  tooltip: null,
  onIconClick: null
};

export default Info;
