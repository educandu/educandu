import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import { SelectFieldIcon } from '../../components/icons/icons.js';
import { createDefaultContent, validateContent } from './select-field-utils.js';

class SelectFieldInfo {
  static typeName = 'select-field';

  allowsInput = true;

  getDisplayName(t) {
    return t('selectField:name');
  }

  getIcon() {
    return <SelectFieldIcon />;
  }

  async resolveDisplayComponent() {
    return (await import('./select-field-display.js')).default;
  }

  async resolveEditorComponent() {
    return (await import('./select-field-editor.js')).default;
  }

  getDefaultContent() {
    return createDefaultContent();
  }

  validateContent(content) {
    validateContent(content);
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content) {
    return cloneDeep(content);
  }

  getCdnResources() {
    return [];
  }
}

export default SelectFieldInfo;
