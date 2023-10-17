import React from 'react';
import classNames from 'classnames';
import { Checkbox, Form, Radio } from 'antd';
import { SELECT_FIELD_MODE } from './constants.js';
import Markdown from '../../components/markdown.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import { ensureIsExcluded, ensureIsIncluded } from '../../utils/array-utils.js';

const FormItem = Form.Item;

export default function SelectFieldDisplay({ content, input, canModifyInput, onInputChanged }) {
  const { mode, label, maxColumns, width, items } = content;
  const { data } = input;

  const selectedValues = data?.selectedValues || [];

  let InputComponent;
  let handleSelectionChange;
  switch (mode) {
    case SELECT_FIELD_MODE.singleSelection:
      InputComponent = Radio;
      handleSelectionChange = event => {
        const newSelectedValues = event.target.checked
          ? [event.target.value]
          : [];
        onInputChanged({ selectedValues: newSelectedValues });
      };
      break;
    case SELECT_FIELD_MODE.multiSelection:
      InputComponent = Checkbox;
      handleSelectionChange = event => {
        const newSelectedValues = event.target.checked
          ? ensureIsIncluded(selectedValues, event.target.value)
          : ensureIsExcluded(selectedValues, event.target.value);
        onInputChanged({ selectedValues: newSelectedValues });
      };
      break;
    default:
      throw new Error(`Invalid select input mode: '${mode}'`);
  }

  return (
    <div className={`SelectFieldDisplay u-horizontally-centered u-width-${width}`}>
      <Form layout="vertical">
        <FormItem label={label ? <Markdown inline>{label}</Markdown> : null}>
          <div className={`SelectFieldDisplay-grid SelectFieldDisplay-grid--${maxColumns}`}>
            {items.map(item => (
              <InputComponent
                key={item.key}
                value={item.key}
                checked={selectedValues.includes(item.key)}
                onChange={handleSelectionChange}
                disabled={!canModifyInput}
                className={classNames({ 'u-readonly-input': !canModifyInput })}
                >
                <Markdown inline>{item.text}</Markdown>
              </InputComponent>
            ))}
          </div>
        </FormItem>
      </Form>
    </div>
  );
}

SelectFieldDisplay.propTypes = {
  ...sectionDisplayProps
};
