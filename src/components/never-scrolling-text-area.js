import { Input } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import React, { useContext } from 'react';
import DebouncedInput from './debounced-input.js';
import { FormItemInputContext } from '../utils/pre-resolved-modules.js';
import { HORIZONTAL_ALIGNMENT, VERTICAL_ALIGNMENT } from '../domain/constants.js';

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

function NeverScrollingTextArea({ className, disabled, embeddable, debounced, debouncedApiRef, horizontalAlignment, minRows, verticalAlignment, ...textAreaProps }) {
  const context = useContext(FormItemInputContext);

  const componentClasses = classNames(
    'NeverScrollingTextArea',
    {
      'NeverScrollingTextArea--verticalAlignmentTop': verticalAlignment === VERTICAL_ALIGNMENT.top,
      'NeverScrollingTextArea--verticalAlignmentMiddle': verticalAlignment === VERTICAL_ALIGNMENT.middle,
      'NeverScrollingTextArea--verticalAlignmentBottom': verticalAlignment === VERTICAL_ALIGNMENT.bottom,
      'NeverScrollingTextArea--horizontalAlignmentLeft': horizontalAlignment === HORIZONTAL_ALIGNMENT.left,
      'NeverScrollingTextArea--horizontalAlignmentCenter': horizontalAlignment === HORIZONTAL_ALIGNMENT.center,
      'NeverScrollingTextArea--horizontalAlignmentRight': horizontalAlignment === HORIZONTAL_ALIGNMENT.right,
      'NeverScrollingTextArea--embeddable': embeddable,
      'is-disabled': disabled,
      'has-error': context.status === 'error',
      'has-warning': context.status === 'warning'
    },
    className
  );

  const renderCount = () => !!textAreaProps.maxLength && (
    <div className="u-input-count">{(textAreaProps.value || '').length} / {textAreaProps.maxLength}</div>
  );

  return (
    <div className={componentClasses}>
      <div onClick={disabled ? null : handleTopContainerClick} />
      <FormItemInputContext.Provider value={EMPTY_OBJECT}>
        {!debounced && (
          <TextArea {...textAreaProps} autoSize={{ minRows }} disabled={disabled} />
        )}
        {!!debounced && (
          <DebouncedInput apiRef={debouncedApiRef} {...textAreaProps} autoSize={{ minRows }} disabled={disabled} elementType={TextArea} />
        )}
      </FormItemInputContext.Provider>
      <div onClick={disabled ? null : handleBottomContainerClick} />
      {renderCount()}
    </div>
  );
}

NeverScrollingTextArea.propTypes = {
  className: PropTypes.string,
  disabled: PropTypes.bool,
  embeddable: PropTypes.bool,
  debounced: PropTypes.bool,
  debouncedApiRef: PropTypes.object,
  horizontalAlignment: PropTypes.oneOf(Object.values(HORIZONTAL_ALIGNMENT)),
  minRows: PropTypes.number,
  verticalAlignment: PropTypes.oneOf(Object.values(VERTICAL_ALIGNMENT))
};

NeverScrollingTextArea.defaultProps = {
  className: null,
  disabled: false,
  embeddable: false,
  debounced: false,
  debouncedApiRef: { current: null },
  horizontalAlignment: HORIZONTAL_ALIGNMENT.left,
  minRows: 3,
  verticalAlignment: VERTICAL_ALIGNMENT.top
};

export default NeverScrollingTextArea;
