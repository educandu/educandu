import React from 'react';
import PropTypes from 'prop-types';
import { DOCUMENT_IMPORT_TYPE } from '../common/constants.js';
import { DownloadOutlined, HistoryOutlined, RedoOutlined } from '@ant-design/icons';

function ImportTypeIcon({ importType }) {
  switch (importType) {
    case DOCUMENT_IMPORT_TYPE.add:
      return <DownloadOutlined />;
    case DOCUMENT_IMPORT_TYPE.update:
      return <HistoryOutlined />;
    case DOCUMENT_IMPORT_TYPE.reimport:
      return <RedoOutlined />;
    default:
      throw new Error(`Invalid import type: '${importType}'`);
  }
}

ImportTypeIcon.propTypes = {
  importType: PropTypes.oneOf(Object.values(DOCUMENT_IMPORT_TYPE)).isRequired
};

export default ImportTypeIcon;
