import by from 'thenby';
import React from 'react';
import { Tooltip } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import cloneDeep from '../utils/clone-deep.js';
import { useTranslation } from 'react-i18next';
import DeleteIcon from './icons/general/delete-icon.js';
import { isTouchDevice } from '../ui/browser-helper.js';
import PreviewIcon from './icons/general/preview-icon.js';
import { cdnObjectShape } from '../ui/default-prop-types.js';
import { confirmCdnFileDelete } from './confirmation-dialogs.js';
import { CDN_OBJECT_TYPE, RESOURCE_TYPE } from '../domain/constants.js';
import { composeHumanReadableDisplayName } from '../utils/storage-utils.js';
import { getResourceIcon, getResourceType } from '../utils/resource-utils.js';
import FolderFilledNavigateIcon from './icons/files/folder-filled-navigate-icon.js';
import ActionButton, { ActionButtonGroup, ACTION_BUTTON_INTENT } from './action-button.js';

function FilesGridViewer({
  files,
  parentDirectory,
  selectedFileUrl,
  canDelete,
  canNavigateToParent,
  onFileClick,
  onFileDoubleClick,
  onDeleteFileClick,
  onPreviewFileClick,
  onNavigateToParent
}) {
  const { t } = useTranslation('filesGridViewer');

  const displayFiles = files
    .map(file => {
      return {
        ...cloneDeep(file),
        name: composeHumanReadableDisplayName({ cdnObject: file, t })
      };
    })
    .sort(by(file => file.name, { ignorecase: true }));

  const handlePreviewClick = (event, file) => {
    event.stopPropagation();
    onPreviewFileClick(file);
  };

  const handleDeleteClick = (event, file) => {
    event.stopPropagation();
    confirmCdnFileDelete(t, file.name, () => onDeleteFileClick(file));
  };

  const handleParentLinkClick = () => {
    if (isTouchDevice()) {
      onNavigateToParent();
    }
  };

  const handleParentLinkDoubleClick = () => {
    onNavigateToParent();
  };

  const renderFile = file => {
    let fileDisplay;
    if (getResourceType(file.url) === RESOURCE_TYPE.image) {
      fileDisplay = <img className="FilesGridViewer-fileDisplayImage" src={file.url} />;
    } else {
      const Icon = getResourceIcon({ url: file.url, isDirectory: file.type === CDN_OBJECT_TYPE.directory, filled: true });
      fileDisplay = <Icon />;
    }
    const classes = classNames('FilesGridViewer-fileContainer', { 'is-selected': file.portableUrl === selectedFileUrl });
    const actionsClasses = classNames('FilesGridViewer-actions', { 'are-visible': file.portableUrl === selectedFileUrl });

    return (
      <div className={classes} key={file.portableUrl}>
        <Tooltip title={file.name} placement="bottom">
          <a className="FilesGridViewer-file" onClick={() => onFileClick(file)} onDoubleClick={() => onFileDoubleClick(file)}>
            <div className="FilesGridViewer-fileDisplay">
              {fileDisplay}
            </div>
            <span className="FilesGridViewer-fileName">{file.name}</span>
          </a>
        </Tooltip>
        <div className={actionsClasses} onClick={() => onFileClick(file)}>
          <ActionButtonGroup>
            <ActionButton
              title={t('common:preview')}
              icon={<PreviewIcon />}
              intent={ACTION_BUTTON_INTENT.success}
              onClick={event => handlePreviewClick(event, file)}
              overlay
              />
            {canDelete && (
              <ActionButton
                title={t('common:delete')}
                icon={<DeleteIcon />}
                intent={ACTION_BUTTON_INTENT.error}
                onClick={event => handleDeleteClick(event, file)}
                overlay
                />
            )}
          </ActionButtonGroup>
        </div>
      </div>
    );
  };

  return (
    <div className="FilesGridViewer">
      {canNavigateToParent && (
        <Tooltip title={t('navigateToParent')} placement="topLeft">
          <div className="FilesGridViewer-fileContainer">
            <a className="FilesGridViewer-file FilesGridViewer-file--parentLink" onClick={handleParentLinkClick} onDoubleClick={handleParentLinkDoubleClick} >
              <div className="FilesGridViewer-fileDisplay">
                <FolderFilledNavigateIcon />
              </div>
              <div>{parentDirectory?.displayName || '..'}</div>
            </a>
          </div>
        </Tooltip>
      )}
      {displayFiles.map(file => renderFile(file))}
    </div>
  );
}

FilesGridViewer.propTypes = {
  canDelete: PropTypes.bool,
  canNavigateToParent: PropTypes.bool,
  files: PropTypes.arrayOf(cdnObjectShape).isRequired,
  onDeleteFileClick: PropTypes.func,
  onFileClick: PropTypes.func,
  onFileDoubleClick: PropTypes.func,
  onNavigateToParent: PropTypes.func,
  onPreviewFileClick: PropTypes.func,
  parentDirectory: cdnObjectShape,
  selectedFileUrl: PropTypes.string
};

FilesGridViewer.defaultProps = {
  canDelete: false,
  canNavigateToParent: false,
  onDeleteFileClick: () => {},
  onFileClick: () => {},
  onFileDoubleClick: () => {},
  onNavigateToParent: () => {},
  onPreviewFileClick: () => {},
  parentDirectory: null,
  selectedFileUrl: null
};

export default FilesGridViewer;
