import React from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import { CloseOutlined } from '@ant-design/icons';

function FocusHeader({ title, children, onClose }) {
  return (
    <div className="FocusHeader">
      <div className="FocusHeader-title">
        {title}
      </div>
      <div className="FocusHeader-content">
        {children}
      </div>
      <div>
        <Button type="link" icon={<CloseOutlined />} onClick={onClose} />
      </div>
    </div>
  );
}

FocusHeader.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  onClose: PropTypes.func
};

FocusHeader.defaultProps = {
  children: null,
  onClose: () => {}
};

export default FocusHeader;
