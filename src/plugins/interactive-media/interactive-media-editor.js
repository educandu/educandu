import React from 'react';
import { sectionEditorProps } from '../../ui/default-prop-types.js';

function InteractiveMediaEditor({ content }) {
  return <div className="InteractiveMediaEditor">Editor - content: {JSON.stringify(content)}</div>;
}

InteractiveMediaEditor.propTypes = {
  ...sectionEditorProps
};

export default InteractiveMediaEditor;
