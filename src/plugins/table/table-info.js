import React from 'react';
import TableIcon from './table-icon.js';
import TableDisplay from './table-display.js';
import cloneDeep from '../../utils/clone-deep.js';

class TableInfo {
  static get typeName() { return 'table'; }

  constructor() {
    this.type = 'table';
  }

  getName(t) {
    return t('table:name');
  }

  getIcon() {
    return <TableIcon />;
  }

  getDisplayComponent() {
    return TableDisplay;
  }

  async resolveEditorComponent() {
    return (await import('./table-editor.js')).default;
  }

  getDefaultContent() {
    return {
      rowCount: 3,
      columnCount: 3,
      cells: [
        { startRow: 0, startColumn: 0, rowSpan: 1, columnSpan: 1, text: '' },
        { startRow: 0, startColumn: 1, rowSpan: 1, columnSpan: 1, text: '' },
        { startRow: 0, startColumn: 2, rowSpan: 1, columnSpan: 1, text: '' },
        { startRow: 1, startColumn: 0, rowSpan: 1, columnSpan: 1, text: '' },
        { startRow: 1, startColumn: 1, rowSpan: 1, columnSpan: 1, text: '' },
        { startRow: 1, startColumn: 2, rowSpan: 1, columnSpan: 1, text: '' },
        { startRow: 2, startColumn: 0, rowSpan: 1, columnSpan: 1, text: '' },
        { startRow: 2, startColumn: 1, rowSpan: 1, columnSpan: 1, text: '' },
        { startRow: 2, startColumn: 2, rowSpan: 1, columnSpan: 1, text: '' }
      ],
      renderMedia: false
    };
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

export default TableInfo;
