import React from 'react';
import { Tooltip } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { DOCUMENT_IMPORT_TYPE } from '../domain/constants.js';
import { DownloadOutlined, HistoryOutlined, RedoOutlined } from '@ant-design/icons';

function ImportTypeIcon({ importType }) {
  const { t } = useTranslation('importTypeIcon');
  let icon;

  switch (importType) {
    case DOCUMENT_IMPORT_TYPE.add:
      icon = <DownloadOutlined />;
      break;
    case DOCUMENT_IMPORT_TYPE.update:
      icon = <HistoryOutlined />;
      break;
    case DOCUMENT_IMPORT_TYPE.reimport:
      icon = <RedoOutlined />;
      break;
    default:
      throw new Error(`Invalid import type: '${importType}'`);
  }

  return (
    <Tooltip className="ImportTypeIcon" title={t(importType)}>{icon}</Tooltip>
  );
}

ImportTypeIcon.propTypes = {
  importType: PropTypes.oneOf(Object.values(DOCUMENT_IMPORT_TYPE)).isRequired
};

export default ImportTypeIcon;
