import React from 'react';
import { sectionEditorProps } from '../../ui/default-prop-types.js';

// eslint-disable-next-line no-unused-vars
function MemoryEditor({ content, onContentChanged }) {

  return (
    <div>Memory editor</div>
  );
}

MemoryEditor.propTypes = {
  ...sectionEditorProps
};

export default MemoryEditor;

