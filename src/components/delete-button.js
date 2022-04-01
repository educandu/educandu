import React from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import DeleteIcon from './icons/general/delete-icon.js';

function DeleteButton({ className, ...props }) {
  return (
    <Button className={`DeleteButton ${className}`} size="small" type="link" icon={<DeleteIcon />} {...props} />
  );
}

DeleteButton.propTypes = {
  className: PropTypes.string
};

DeleteButton.defaultProps = {
  className: ''
};

export default DeleteButton;
