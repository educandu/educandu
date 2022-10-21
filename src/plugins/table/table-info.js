import joi from 'joi';
import React from 'react';
import TableIcon from './table-icon.js';
import TableDisplay from './table-display.js';
import cloneDeep from '../../utils/clone-deep.js';
import { couldAccessUrlFromRoom } from '../../utils/source-utils.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';
import { HORIZONTAL_ALIGNMENT, VERTICAL_ALIGNMENT } from '../../domain/constants.js';
import { CELL_TYPE, COLUMN_DISTRIBUTION, createEmptyCell, createTableCellsFlat } from './table-utils.js';

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
      columnDistribution: COLUMN_DISTRIBUTION.automatic,
      width: 100
    };
  }

  validateContent(content) {
    const schema = joi.object({
      rowCount: joi.number().min(1).required(),
      columnCount: joi.number().min(1).required(),
      cells: joi.array().items(joi.object({
        rowIndex: joi.number().min(0).required(),
        columnIndex: joi.number().min(0).required(),
        rowSpan: joi.number().min(1).required(),
        columnSpan: joi.number().min(1).required(),
        cellType: joi.string().valid(...Object.values(CELL_TYPE)).required(),
        text: joi.string().allow('').required(),
        verticalAlignment: joi.string().valid(...Object.values(VERTICAL_ALIGNMENT)).required(),
        horizontalAlignment: joi.string().valid(...Object.values(HORIZONTAL_ALIGNMENT)).required()
      })).required(),
      columnDistribution: joi.string().valid(...Object.values(COLUMN_DISTRIBUTION)).required(),
      width: joi.number().min(0).max(100).required()
    });

    joi.attempt(content, schema, { abortEarly: false, convert: false, noDefaults: true });
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    for (const cell of redactedContent.cells) {
      cell.text = this.gfm.redactCdnResources(
        cell.text,
        url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
      );
    }

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    for (const cell of content.cells) {
      cdnResources.push(...this.gfm.extractCdnResources(cell.text));
    }

    return [...new Set(cdnResources)].filter(cdnResource => cdnResource);
  }
}

export default TableInfo;
