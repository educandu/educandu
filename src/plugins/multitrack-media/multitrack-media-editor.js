import React from 'react';
import { sectionEditorProps } from '../../ui/default-prop-types.js';

function MultitrackMediaEditor({ content }) {
  const { width } = content;

  return (
    <div className="MultitrackMediaEditor">
      {width}
    </div>
  );
}

MultitrackMediaEditor.propTypes = {
  ...sectionEditorProps
};

export default MultitrackMediaEditor;
