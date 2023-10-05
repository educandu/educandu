import { Form, Input } from 'antd';
import React, { useState } from 'react';
import { TEXT_INPUT_MODE } from './constants.js';
import Markdown from '../../components/markdown.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import NeverScrollingTextArea from '../../components/never-scrolling-text-area.js';

const FormItem = Form.Item;

export default function TextFieldDisplay({ content }) {
  const [currentValue, setCurrentValue] = useState('');
  const { mode, label, maxLength, width } = content;

  const handleCurrentValueChange = event => {
    setCurrentValue(event.target.value);
  };

  const InputComponent = mode === TEXT_INPUT_MODE.singleLine ? Input : NeverScrollingTextArea;

  return (
    <div className={`u-horizontally-centered u-width-${width}`}>
      <Form layout="vertical">
        <FormItem label={label ? <Markdown inline>{label}</Markdown> : null}>
          <InputComponent
            value={currentValue}
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
