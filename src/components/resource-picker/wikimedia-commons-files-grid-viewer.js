import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Spin, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import PreviewIcon from '../icons/general/preview-icon.js';
import { wikimediaFileShape } from '../../ui/default-prop-types.js';
import ActionButton, { ActionButtonGroup, ACTION_BUTTON_INTENT } from '../action-button.js';

function WikimediaCommonsFilesGridViewer({
  files,
  isLoading,
  selectedFileUrl,
  onFileClick,
  onFileDoubleClick,
  onPreviewFileClick
}) {
  const { t } = useTranslation();

  const handlePreviewClick = (event, file) => {
    event.stopPropagation();
    onPreviewFileClick(file);
  };

  const renderFile = file => {
    const classes = classNames('WikimediaCommonsFilesGridViewer-fileContainer', { 'is-selected': file.url === selectedFileUrl });
    const actionsClasses = classNames('WikimediaCommonsFilesGridViewer-actions', { 'are-visible': file.url === selectedFileUrl });

    return (
      <div className={classes} key={file.url}>
        <Tooltip title={file.displayName} placement="bottom">
          <a className="WikimediaCommonsFilesGridViewer-file" onClick={() => onFileClick(file)} onDoubleClick={() => onFileDoubleClick(file)}>
            <div className="WikimediaCommonsFilesGridViewer-fileDisplay">
              <img className="WikimediaCommonsFilesGridViewer-fileDisplayImage" src={file.thumbnailUrl} />
            </div>
            <span className="WikimediaCommonsFilesGridViewer-fileName">{file.displayName}</span>
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
          </ActionButtonGroup>
        </div>
      </div>
    );
  };

  return (
    <div className="WikimediaCommonsFilesGridViewer">
      <div className="WikimediaCommonsFilesGridViewer-files">
        {files.map(file => renderFile(file))}
      </div>
      <div className={classNames('WikimediaCommonsFilesGridViewer-loadingOverlay', { 'is-disabled': !isLoading })}>
        <Spin size="large" />
      </div>
    </div>

  );
}

WikimediaCommonsFilesGridViewer.propTypes = {
  files: PropTypes.arrayOf(wikimediaFileShape).isRequired,
  isLoading: PropTypes.bool,
  onFileClick: PropTypes.func,
  onFileDoubleClick: PropTypes.func,
  onPreviewFileClick: PropTypes.func,
  selectedFileUrl: PropTypes.string
};

WikimediaCommonsFilesGridViewer.defaultProps = {
  isLoading: false,
  onFileClick: () => {},
  onFileDoubleClick: () => {},
  onPreviewFileClick: () => {},
  selectedFileUrl: null
};

export default WikimediaCommonsFilesGridViewer;
