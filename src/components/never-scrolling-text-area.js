import { Input } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import React, { useContext } from 'react';
import { FormItemInputContext } from '../utils/pre-resolved-modules.js';

const { TextArea } = Input;

const EMPTY_OBJECT = {};

const handleComponentClick = event => {
  if (event.target === event.currentTarget) {
    const textarea = event.target.querySelector('textarea');
    if (textarea) {
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }
  }
};

function NeverScrollingTextArea({ disabled, minRows, ...textAreaProps }) {
  const context = useContext(FormItemInputContext);

  const componentClasses = classNames({
    'NeverScrollingTextArea': true,
    'is-disabled': disabled,
    'has-error': context.status === 'error',
    'has-warning': context.status === 'warning'
  });

  return (
    <div className={componentClasses} onClick={disabled ? null : handleComponentClick}>
      <FormItemInputContext.Provider value={EMPTY_OBJECT}>
        <TextArea {...textAreaProps} autoSize={{ minRows }} disabled={disabled} />
      </FormItemInputContext.Provider>
    </div>
  );
}

NeverScrollingTextArea.propTypes = {
  disabled: PropTypes.bool,
  minRows: PropTypes.number
};

NeverScrollingTextArea.defaultProps = {
  disabled: false,
  minRows: 3
};

export default NeverScrollingTextArea;
