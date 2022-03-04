import React from 'react';
import { Tooltip } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import DownloadIcon from './icons/general/download-icon.js';
import { DOCUMENT_IMPORT_TYPE } from '../domain/constants.js';
import { HistoryOutlined, RedoOutlined } from '@ant-design/icons';

function ImportTypeIcon({ importType }) {
  const { t } = useTranslation('importTypeIcon');
  let icon;

  switch (importType) {
    case DOCUMENT_IMPORT_TYPE.add:
      icon = <DownloadIcon />;
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
    <Tooltip className="ImportTypeIcon" title={t(importType)}><span>{icon}</span></Tooltip>
  );
}

ImportTypeIcon.propTypes = {
  importType: PropTypes.oneOf(Object.values(DOCUMENT_IMPORT_TYPE)).isRequired
};

export default ImportTypeIcon;
