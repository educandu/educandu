import { Tooltip } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RESOURCE_TYPE } from '../domain/constants.js';
import DeleteIcon from './icons/general/delete-icon.js';
import PreviewIcon from './icons/general/preview-icon.js';
import { confirmCdnFileDelete } from './confirmation-dialogs.js';
import { getResourceIcon, getResourceType } from '../utils/resource-utils.js';
import { FolderFilledIconComponent } from './icons/files/folder-filled-icon.js';

function FilesGridViewer({
  files,
  canDelete,
  canNavigateToParent,
  onDeleteClick,
  onPreviewClick,
  onSelectionChange,
  onNavigateToParentClick
}) {
  const { t } = useTranslation('filesGridViewer');
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileClick = file => {
    const newSelectedFile = file.name === selectedFile?.name || selectedFile?.isDirectory ? null : file;

    setSelectedFile(newSelectedFile);
    onSelectionChange(newSelectedFile);
  };

  const handlePreviewClick = (event, file) => {
    event.stopPropagation();
    onPreviewClick(file);
  };

  const handleDeleteFile = file => {
    onDeleteClick(file);
  };

  const handleDeleteClick = (event, file) => {
    event.stopPropagation();
    confirmCdnFileDelete(t, file.name, () => handleDeleteFile(file));
  };

  const renderFile = file => {
    let fileDisplay;
    if (getResourceType(file.url) === RESOURCE_TYPE.image) {
      fileDisplay = <img className="FilesGridViewer-fileDisplayImage" src={file.url} />;
    } else {
      const Icon = getResourceIcon({ filePath: file.path, isDirectory: file.isDirectory, filled: true });
      fileDisplay = <Icon />;
    }
    const overlayClasses = classNames('FilesGridViewer-fileOverlay', { 'is-visible': file.name === selectedFile?.name });
    const actionsClasses = classNames('FilesGridViewer-actions', { 'are-visible': file.name === selectedFile?.name });

    return (
      <div className="FilesGridViewer-fileContainer" key={file.path}>
        <a className="FilesGridViewer-file" onClick={() => handleFileClick(file)}>
          <div className="FilesGridViewer-fileDisplay">
            {fileDisplay}
          </div>
          <span>{file.name}</span>
        </a>
        <div className={overlayClasses} />
        <div className={actionsClasses} onClick={() => handleFileClick(file)}>
          <Tooltip title={t('common:preview')}>
            <a
              className="FilesGridViewer-action FilesGridViewer-action--preview"
              onClick={event => handlePreviewClick(event, file)}
              >
              <PreviewIcon />
            </a>
          </Tooltip>
          {canDelete && (
            <Tooltip title={t('common:delete')}>
              <a
                className="FilesGridViewer-action FilesGridViewer-action--delete"
                onClick={event => handleDeleteClick(event, file)}
                >
                <DeleteIcon />
              </a>
            </Tooltip>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="FilesGridViewer">
      {canNavigateToParent && (
        <Tooltip title={t('navigateToParent')} placement="topLeft">
          <div className="FilesGridViewer-fileContainer">
            <a className="FilesGridViewer-file" onClick={onNavigateToParentClick}>
              <div className="FilesGridViewer-fileDisplay">
                <FolderFilledIconComponent />
              </div>
              <div>...</div>
            </a>
          </div>
        </Tooltip>
      )}
      {files.map(file => renderFile(file))}
    </div>
  );
}

FilesGridViewer.propTypes = {
  canDelete: PropTypes.bool,
  canNavigateToParent: PropTypes.bool,
  files: PropTypes.arrayOf(PropTypes.shape({
    url: PropTypes.string,
    path: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    isDirectory: PropTypes.bool.isRequired
  })).isRequired,
  onDeleteClick: PropTypes.func,
  onNavigateToParentClick: PropTypes.func,
  onPreviewClick: PropTypes.func,
  onSelectionChange: PropTypes.func
};

FilesGridViewer.defaultProps = {
  canDelete: false,
  canNavigateToParent: false,
  onDeleteClick: () => { },
  onNavigateToParentClick: () => { },
  onPreviewClick: () => { },
  onSelectionChange: () => { }
};

export default FilesGridViewer;
