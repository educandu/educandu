import React from 'react';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import { Button } from 'antd';

export default function TestEditor({ content, onContentChanged }) {

  const handleClick = () => {
    onContentChanged({ text: new Date().toString() });
  };

  return (
    <div>
      <Button onClick={handleClick}>Click here </Button>
      {content.text}
    </div>
  );
}

TestEditor.propTypes = {
  ...sectionEditorProps
};
