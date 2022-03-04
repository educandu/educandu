import React from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import DeleteIcon from './icons/general/delete-icon.js';

function DeleteButton({ children, onClick, disabled }) {
  return (
    <Button className="DeleteButton" size="small" type="link" icon={<DeleteIcon />} disabled={disabled} onClick={onClick}>
      {children}
    </Button>
  );
}

DeleteButton.propTypes = {
  children: PropTypes.node,
  disabled: PropTypes.bool,
  onClick: PropTypes.func
};

DeleteButton.defaultProps = {
  children: null,
  disabled: false,
  onClick: () => {}
};

export default DeleteButton;
