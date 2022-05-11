import React from 'react';
import { Tooltip } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { FileOutlined, FolderOpenOutlined, FolderOutlined } from '@ant-design/icons';

function FilesGridViewer({ files, canNavigateToParent, onNavigateToParent, onFileClick }) {
  const { t } = useTranslation('filesGridViewer');

  const renderFile = file => {
    return (
      <a className="FilesGridViewer-fileContainer" key={file.path} onClick={() => onFileClick(file)}>
        <div>
          {file.isDirectory && <FolderOutlined className="FilesGridViewer-fileIcon" />}
          {!file.isDirectory && <FileOutlined className="FilesGridViewer-fileIcon" />}
        </div>
        <span>{file.name}</span>
      </a>
    );
  };

  return (
    <div className="FilesGridViewer">
      {canNavigateToParent && (
        <Tooltip title={t('navigateToParent')} placement="topLeft">
          <a className="FilesGridViewer-fileContainer" onClick={onNavigateToParent}>
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
  onNavigateToParent: PropTypes.func
};

FilesGridViewer.defaultProps = {
  canNavigateToParent: false,
  onFileClick: () => {},
  onNavigateToParent: () => {}
};

export default FilesGridViewer;
