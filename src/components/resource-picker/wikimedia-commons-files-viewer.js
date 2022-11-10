import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Spin, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import PreviewIcon from '../icons/general/preview-icon.js';
import useInfiniteScroll from 'react-infinite-scroll-hook';
import { wikimediaFileShape } from '../../ui/default-prop-types.js';
import WikimediaCommonsIcon from '../icons/wikimedia-commons/wikimedia-commons-icon.js';
import ActionButton, { ActionButtonGroup, ACTION_BUTTON_INTENT } from '../action-button.js';

function WikimediaCommonsFilesViewer({
  files,
  isLoading,
  canLoadMore,
  selectedFileUrl,
  onLoadMore,
  onFileClick,
  onFileDoubleClick,
  onPreviewFileClick,
  onOpenWikimediaCommonsPageClick
}) {
  const { t } = useTranslation('wikimediaCommonsFilesViewer');

  const [sentryRef, { rootRef }] = useInfiniteScroll({
    loading: isLoading,
    hasNextPage: canLoadMore,
    onLoadMore,
    disabled: false,
    rootMargin: '0px 0px 100px 0px'
  });

  const handleOpenWikimediaCommonsPageClick = (event, file) => {
    event.stopPropagation();
    onOpenWikimediaCommonsPageClick(file);
  };

  const handlePreviewClick = (event, file) => {
    event.stopPropagation();
    onPreviewFileClick(file);
  };

  const renderFile = file => {
    const classes = classNames({
      'WikimediaCommonsFilesViewer-itemContainer': true,
      'WikimediaCommonsFilesViewer-itemContainer--file': true,
      'is-selected': file.url === selectedFileUrl
    });

    const actionsClasses = classNames({
      'WikimediaCommonsFilesViewer-actions': true,
      'are-visible': file.url === selectedFileUrl
    });

    return (
      <div className={classes} key={file.url}>
        <Tooltip title={file.displayName} placement="bottom">
          <a className="WikimediaCommonsFilesViewer-file" onClick={() => onFileClick(file)} onDoubleClick={() => onFileDoubleClick(file)}>
            <div className="WikimediaCommonsFilesViewer-fileDisplay">
              <img className="WikimediaCommonsFilesViewer-fileDisplayImage" src={file.thumbnailUrl} />
            </div>
            <span className="WikimediaCommonsFilesViewer-fileName">{file.displayName}</span>
          </a>
        </Tooltip>
        <div className={actionsClasses} onClick={() => onFileClick(file)}>
          <ActionButtonGroup>
            <ActionButton
              title={t('openWikimediaCommonsPage')}
              icon={<WikimediaCommonsIcon />}
              intent={ACTION_BUTTON_INTENT.default}
              onClick={event => handleOpenWikimediaCommonsPageClick(event, file)}
              overlay
              />
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

  const renderSentry = () => {
    const classes = classNames({
      'WikimediaCommonsFilesViewer-itemContainer': true,
      'WikimediaCommonsFilesViewer-itemContainer--sentry': true,
      'is-disabled': !canLoadMore
    });

    return (
      <div ref={sentryRef} className={classes} key="sentry">
        <Spin size="large" spinning={isLoading && files.length} />
      </div>
    );
  };

  return (
    <div ref={rootRef} className="WikimediaCommonsFilesViewer">
      <div className="WikimediaCommonsFilesViewer-files">
        {files.map(file => renderFile(file))}
        {renderSentry()}
      </div>
      <div className={classNames('WikimediaCommonsFilesViewer-loadingOverlay', { 'is-disabled': !isLoading })}>
        <Spin size="large" />
      </div>
    </div>

  );
}

WikimediaCommonsFilesViewer.propTypes = {
  canLoadMore: PropTypes.bool.isRequired,
  files: PropTypes.arrayOf(wikimediaFileShape).isRequired,
  isLoading: PropTypes.bool,
  onFileClick: PropTypes.func.isRequired,
  onFileDoubleClick: PropTypes.func.isRequired,
  onLoadMore: PropTypes.func.isRequired,
  onOpenWikimediaCommonsPageClick: PropTypes.func.isRequired,
  onPreviewFileClick: PropTypes.func.isRequired,
  selectedFileUrl: PropTypes.string
};

WikimediaCommonsFilesViewer.defaultProps = {
  isLoading: false,
  selectedFileUrl: null
};

export default WikimediaCommonsFilesViewer;