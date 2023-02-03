import by from 'thenby';
import { Tooltip } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import cloneDeep from '../../utils/clone-deep.js';
import React, { useEffect, useState } from 'react';
import DeleteIcon from '../icons/general/delete-icon.js';
import { RESOURCE_TYPE } from '../../domain/constants.js';
import PreviewIcon from '../icons/general/preview-icon.js';
import { cdnObjectShape } from '../../ui/default-prop-types.js';
import { confirmCdnFileDelete } from '../confirmation-dialogs.js';
import { getResourceIcon, getResourceType } from '../../utils/resource-utils.js';
import ActionButton, { ActionButtonGroup, ACTION_BUTTON_INTENT } from '../action-button.js';

const mapDisplayFiles = files => {
  return files
    .map(file => ({
      ...cloneDeep(file),
      name: file.displayName
    }))
    .sort(by(file => file.name, { ignorecase: true }));
};

function FilesGridViewer({
  files,
  selectedFileUrl,
  canDelete,
  onFileClick,
  onFileDoubleClick,
  onDeleteFileClick,
  onPreviewFileClick
}) {
  const { t } = useTranslation('filesGridViewer');
  const [displayFiles, setDisplayFiles] = useState(mapDisplayFiles(files));

  useEffect(() => {
    setDisplayFiles(mapDisplayFiles(files));
  }, [files, t]);

  const handlePreviewClick = (event, file) => {
    event.stopPropagation();
    onPreviewFileClick(file);
  };

  const handleDeleteClick = (event, file) => {
    event.stopPropagation();
    confirmCdnFileDelete(t, file.name, () => onDeleteFileClick(file));
  };

  const renderFile = file => {
    let fileDisplay;
    if (getResourceType(file.url) === RESOURCE_TYPE.image) {
      fileDisplay = <img className="FilesGridViewer-fileDisplayImage" src={file.url} />;
    } else {
      const Icon = getResourceIcon({ url: file.url, filled: true });
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
            {!!canDelete && (
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
      {displayFiles.map(file => renderFile(file))}
    </div>
  );
}

FilesGridViewer.propTypes = {
  canDelete: PropTypes.bool,
  files: PropTypes.arrayOf(cdnObjectShape).isRequired,
  onDeleteFileClick: PropTypes.func,
  onFileClick: PropTypes.func,
  onFileDoubleClick: PropTypes.func,
  onPreviewFileClick: PropTypes.func,
  selectedFileUrl: PropTypes.string
};

FilesGridViewer.defaultProps = {
  canDelete: false,
  onDeleteFileClick: () => {},
  onFileClick: () => {},
  onFileDoubleClick: () => {},
  onPreviewFileClick: () => {},
  selectedFileUrl: null
};

export default FilesGridViewer;
