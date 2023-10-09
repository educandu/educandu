import React from 'react';
import { Form, Input } from 'antd';
import { TEXT_FIELD_MODE } from './constants.js';
import Markdown from '../../components/markdown.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import NeverScrollingTextArea from '../../components/never-scrolling-text-area.js';

const FormItem = Form.Item;

export default function TextFieldDisplay({ content, input, onInputChanged }) {
  const { mode, label, maxLength, width } = content;
  const value = input?.value || '';

  const handleCurrentValueChange = event => {
    onInputChanged({ value: event.target.value });
  };

  let InputComponent;
  switch (mode) {
    case TEXT_FIELD_MODE.singleLine:
      InputComponent = Input;
      break;
    case TEXT_FIELD_MODE.multiLine:
      InputComponent = NeverScrollingTextArea;
      break;
    default:
      throw new Error(`Invalid text field mode: '${mode}'`);
  }

  return (
    <div className={`u-horizontally-centered u-width-${width}`}>
      <Form layout="vertical">
        <FormItem label={label ? <Markdown inline>{label}</Markdown> : null}>
          <InputComponent
            value={value}
            maxLength={maxLength || null}
            onChange={handleCurrentValueChange}
            />
        </FormItem>
      </Form>
    </div>
  );
}

TextFieldDisplay.propTypes = {
  ...sectionDisplayProps
};
