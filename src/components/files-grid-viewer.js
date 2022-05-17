import React from 'react';
import { Tooltip } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { FolderOpenOutlined } from '@ant-design/icons';
import { getResourceIcon } from '../utils/resource-utils.js';

function FilesGridViewer({ files, canNavigateToParent, onNavigateToParentClick, onFileClick }) {
  const { t } = useTranslation('filesGridViewer');

  const renderFile = file => {
    const Icon = getResourceIcon({ filePath: file.path, isDirectory: file.isDirectory });

    return (
      <a className="FilesGridViewer-fileContainer" key={file.path} onClick={() => onFileClick(file)}>
        <div>
          <Icon className="FilesGridViewer-fileIcon" />
        </div>
        <span>{file.name}</span>
      </a>
    );
  };

  return (
    <div className="FilesGridViewer">
      {canNavigateToParent && (
        <Tooltip title={t('navigateToParent')} placement="topLeft">
          <a className="FilesGridViewer-fileContainer" onClick={onNavigateToParentClick}>
            <div>
              <FolderOpenOutlined className="FilesGridViewer-fileIcon" />
            </div>
            ...
          </a>
        </Tooltip>
      )}
      {files.map(file => renderFile(file))}
    </div>
  );
}

FilesGridViewer.propTypes = {
  canNavigateToParent: PropTypes.bool,
  files: PropTypes.arrayOf(PropTypes.shape({
    path: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    isDirectory: PropTypes.bool.isRequired
  })).isRequired,
  onFileClick: PropTypes.func,
  onNavigateToParentClick: PropTypes.func
};

FilesGridViewer.defaultProps = {
  canNavigateToParent: false,
  onFileClick: () => {},
  onNavigateToParentClick: () => {}
};

export default FilesGridViewer;
