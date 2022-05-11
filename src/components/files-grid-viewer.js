import React from 'react';
import { Tooltip } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { FILE_TYPE } from '../domain/constants.js';
import { getFileType } from '../utils/file-utils.js';
import {
  FileImageOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  FolderOutlined
} from '@ant-design/icons';

function FilesGridViewer({ files, canNavigateToParent, onNavigateToParent, onFileClick }) {
  const { t } = useTranslation('filesGridViewer');

  const renderDirectoryIcon = () => <FolderOutlined className="FilesGridViewer-fileIcon" />;
  const renderFileIcon = file => {
    let Icon;
    const fileType = getFileType(file.path);

    switch (fileType) {
      case FILE_TYPE.image:
        Icon = FileImageOutlined;
        break;
      case FILE_TYPE.pdf:
        Icon = FilePdfOutlined;
        break;
      case FILE_TYPE.text:
        Icon = FileTextOutlined;
        break;
      default:
        Icon = FileOutlined;
        break;
    }
    return <Icon className="FilesGridViewer-fileIcon" />;
  };

  const renderFile = file => {
    return (
      <a className="FilesGridViewer-fileContainer" key={file.path} onClick={() => onFileClick(file)}>
        <div>
          {file.isDirectory && renderDirectoryIcon()}
          {!file.isDirectory && renderFileIcon(file)}
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
