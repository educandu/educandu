import { Input } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import React, { useContext } from 'react';
import { FormItemInputContext } from '../utils/pre-resolved-modules.js';

const { TextArea } = Input;

const EMPTY_OBJECT = {};

const selectSiblingTextarea = (element, selectStart) => {
  const textarea = element.parentNode.querySelector('textarea');
  if (textarea) {
    const position = selectStart ? 0 : textarea.value.length;
    textarea.focus();
    textarea.setSelectionRange(position, position);
  }
};

const handleTopContainerClick = event => {
  return (event.target === event.currentTarget) && selectSiblingTextarea(event.target, true);
};

const handleBottomContainerClick = event => {
  return (event.target === event.currentTarget) && selectSiblingTextarea(event.target, false);
};

function NeverScrollingTextArea({ className, disabled, embeddable, minRows, verticalAlign, ...textAreaProps }) {
  const context = useContext(FormItemInputContext);

  const componentClasses = classNames(
    'NeverScrollingTextArea',
    {
      'NeverScrollingTextArea--topAligned': verticalAlign === 'top',
      'NeverScrollingTextArea--centerAligned': verticalAlign === 'center',
      'NeverScrollingTextArea--bottomAligned': verticalAlign === 'bottom',
      'NeverScrollingTextArea--embeddable': embeddable,
      'is-disabled': disabled,
      'has-error': context.status === 'error',
      'has-warning': context.status === 'warning'
    },
    className
  );

  return (
    <div className={componentClasses}>
      <div onClick={disabled ? null : handleTopContainerClick} />
      <FormItemInputContext.Provider value={EMPTY_OBJECT}>
        <TextArea {...textAreaProps} autoSize={{ minRows }} disabled={disabled} />
      </FormItemInputContext.Provider>
      <div onClick={disabled ? null : handleBottomContainerClick} />
    </div>
  );
}

NeverScrollingTextArea.propTypes = {
  className: PropTypes.string,
  disabled: PropTypes.bool,
  embeddable: PropTypes.bool,
  minRows: PropTypes.number,
  verticalAlign: PropTypes.oneOf(['top', 'center', 'bottom'])
};

NeverScrollingTextArea.defaultProps = {
  className: null,
  disabled: false,
  embeddable: false,
  minRows: 3,
  verticalAlign: 'top'
};

export default NeverScrollingTextArea;
