import React from 'react';
import TableIcon from './table-icon.js';
import TableDisplay from './table-display.js';
import cloneDeep from '../../utils/clone-deep.js';
import { createEmptyCell, createTableCellsFlat } from './table-utils.js';
import { isAccessibleStoragePath } from '../../ui/path-helper.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

const DEFAULT_TABLE_ROW_COUNT = 3;
const DEFAULT_TABLE_COLUMN_COUNT = 3;

class TableInfo {
  static get inject() { return [GithubFlavoredMarkdown]; }

  static get typeName() { return 'table'; }

  constructor(gfm) {
    this.gfm = gfm;
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
      rowCount: DEFAULT_TABLE_ROW_COUNT,
      columnCount: DEFAULT_TABLE_COLUMN_COUNT,
      cells: createTableCellsFlat(DEFAULT_TABLE_ROW_COUNT, DEFAULT_TABLE_COLUMN_COUNT, (rowIndex, columnIndex) => createEmptyCell(rowIndex, columnIndex)),
      renderMedia: false,
      width: 100
    };
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    for (const cell of redactedContent.cells) {
      cell.text = this.gfm.redactCdnResources(
        cell.text,
        url => isAccessibleStoragePath(url, targetRoomId) ? url : ''
      );
    }

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    for (const cell of content.cells) {
      cdnResources.push(...this.gfm.extractCdnResources(cell.text || ''));
    }

    return [...new Set(cdnResources)];
  }
}

export default TableInfo;
