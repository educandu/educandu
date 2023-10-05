import React, { useState } from 'react';
import { Checkbox, Form, Radio } from 'antd';
import { SELECT_FIELD_MODE } from './constants.js';
import Markdown from '../../components/markdown.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import { ensureIsExcluded, ensureIsIncluded } from '../../utils/array-utils.js';

const FormItem = Form.Item;

export default function SelectFieldDisplay({ content }) {
  const [selectedValues, setSelectedValues] = useState([]);
  const { mode, label, maxColumns, width, items } = content;

  let InputComponent;
  let handleSelectionChange;
  switch (mode) {
    case SELECT_FIELD_MODE.singleSelection:
      InputComponent = Radio;
      handleSelectionChange = event => {
        setSelectedValues(event.target.checked ? [event.target.value] : []);
      };
      break;
    case SELECT_FIELD_MODE.multiSelection:
      InputComponent = Checkbox;
      handleSelectionChange = event => {
        setSelectedValues(oldValues => event.target.checked
          ? ensureIsIncluded(oldValues, event.target.value)
          : ensureIsExcluded(oldValues, event.target.value));
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
