import React from 'react';
import { Tooltip } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import EditIcon from '../../icons/general/edit-icon.js';
import DeleteIcon from '../../icons/general/delete-icon.js';
import { RESOURCE_TYPE } from '../../../domain/constants.js';
import PreviewIcon from '../../icons/general/preview-icon.js';
import { commonFileShape } from '../../../ui/default-prop-types.js';
import { getResourceIcon, getResourceType } from '../../../utils/resource-utils.js';
import ActionButton, { ActionButtonGroup, ACTION_BUTTON_INTENT } from '../../action-button.js';

function FilesGridViewer({
  files,
  selectedFileUrl,
  canDelete,
  canEdit,
  onDeleteFileClick,
  onEditFileClick,
  onFileClick,
  onFileDoubleClick,
  onPreviewFileClick
}) {
  const { t } = useTranslation();

  const handleDeleteClick = (event, file) => {
    event.stopPropagation();
    onDeleteFileClick(file);
  };

  const handleEditClick = (event, file) => {
    event.stopPropagation();
    onEditFileClick(file);
  };

  const handlePreviewClick = (event, file) => {
    event.stopPropagation();
    onPreviewFileClick(file);
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
        <Tooltip title={file.displayName} placement="bottom">
          <a className="FilesGridViewer-file" onClick={() => onFileClick(file)} onDoubleClick={() => onFileDoubleClick(file)}>
            <div className="FilesGridViewer-fileDisplay">
              {fileDisplay}
            </div>
            <span className="FilesGridViewer-fileName">{file.displayName}</span>
          </a>
        </Tooltip>
        <div className={actionsClasses} onClick={() => onFileClick(file)}>
          <ActionButtonGroup>
            <ActionButton
              title={t('common:preview')}
              icon={<PreviewIcon />}
              onClick={event => handlePreviewClick(event, file)}
              overlay
              />
            {!!canEdit && (
              <ActionButton
                title={t('common:edit')}
                icon={<EditIcon />}
                onClick={event => handleEditClick(event, file)}
                overlay
                />
            )}
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
      {files.map(renderFile)}
    </div>
  );
}

FilesGridViewer.propTypes = {
  canDelete: PropTypes.bool,
  canEdit: PropTypes.bool,
  selectedFileUrl: PropTypes.string,
  files: PropTypes.arrayOf(commonFileShape).isRequired,
  onDeleteFileClick: PropTypes.func,
  onEditFileClick: PropTypes.func,
  onFileClick: PropTypes.func,
  onFileDoubleClick: PropTypes.func,
  onPreviewFileClick: PropTypes.func
};

FilesGridViewer.defaultProps = {
  canDelete: false,
  canEdit: false,
  selectedFileUrl: null,
  onDeleteFileClick: () => {},
  onEditFileClick: () => {},
  onFileClick: () => {},
  onFileDoubleClick: () => {},
  onPreviewFileClick: () => {}
};

export default FilesGridViewer;
