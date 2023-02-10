import PropTypes from 'prop-types';
import classNames from 'classnames';
import React, { memo } from 'react';
import { Spin, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import useInfiniteScroll from 'react-infinite-scroll-hook';
import PreviewIcon from '../../icons/general/preview-icon.js';
import WikimediaIcon from '../../icons/wikimedia/wikimedia-icon.js';
import { wikimediaFileShape } from '../../../ui/default-prop-types.js';
import ActionButton, { ActionButtonGroup, ACTION_BUTTON_INTENT } from '../../action-button.js';

function WikimediaFilesViewer({
  files,
  isLoading,
  canLoadMore,
  selectedFileUrl,
  onLoadMore,
  onFileClick,
  onFileDoubleClick,
  onPreviewFileClick,
  onOpenWikimediaPageClick
}) {
  const { t } = useTranslation('wikimediaFilesViewer');

  const [sentryRef, { rootRef }] = useInfiniteScroll({
    loading: isLoading,
    hasNextPage: canLoadMore,
    onLoadMore,
    disabled: false,
    rootMargin: '0px 0px 100px 0px'
  });

  const handleOpenWikimediaPageClick = (event, file) => {
    event.stopPropagation();
    onOpenWikimediaPageClick(file);
  };

  const handlePreviewClick = (event, file) => {
    event.stopPropagation();
    onPreviewFileClick(file);
  };

  const renderFile = file => {
    const classes = classNames({
      'WikimediaFilesViewer-itemContainer': true,
      'WikimediaFilesViewer-itemContainer--file': true,
      'is-selected': file.url === selectedFileUrl
    });

    const actionsClasses = classNames({
      'WikimediaFilesViewer-actions': true,
      'are-visible': file.url === selectedFileUrl
    });

    return (
      <div className={classes} key={file.url}>
        <Tooltip title={file.displayName} placement="bottom">
          <a className="WikimediaFilesViewer-file" onClick={() => onFileClick(file)} onDoubleClick={() => onFileDoubleClick(file)}>
            <div className="WikimediaFilesViewer-fileDisplay">
              <img className="WikimediaFilesViewer-fileDisplayImage" src={file.thumbnailUrl} />
            </div>
            <span className="WikimediaFilesViewer-fileName">{file.displayName}</span>
          </a>
        </Tooltip>
        <div className={actionsClasses} onClick={() => onFileClick(file)}>
          <ActionButtonGroup>
            <ActionButton
              title={t('openWikimediaPage')}
              icon={<WikimediaIcon />}
              intent={ACTION_BUTTON_INTENT.default}
              onClick={event => handleOpenWikimediaPageClick(event, file)}
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
      'WikimediaFilesViewer-itemContainer': true,
      'WikimediaFilesViewer-itemContainer--sentry': true,
      'is-disabled': !canLoadMore
    });

    return (
      <div ref={sentryRef} className={classes} key="sentry">
        <Spin size="large" spinning={!!isLoading && files.length} />
      </div>
    );
  };

  const isInitialLoad = !!isLoading && !files.length;

  return (
    <div ref={rootRef} className="WikimediaFilesViewer">
      <div className="WikimediaFilesViewer-files">
        {files.map(file => renderFile(file))}
        {renderSentry()}
      </div>
      {!!isInitialLoad && (
        <div className="WikimediaFilesViewer-loadingOverlay">
          <Spin size="large" />
        </div>
      )}
    </div>

  );
}

WikimediaFilesViewer.propTypes = {
  canLoadMore: PropTypes.bool.isRequired,
  files: PropTypes.arrayOf(wikimediaFileShape).isRequired,
  isLoading: PropTypes.bool,
  onFileClick: PropTypes.func.isRequired,
  onFileDoubleClick: PropTypes.func.isRequired,
  onLoadMore: PropTypes.func.isRequired,
  onOpenWikimediaPageClick: PropTypes.func.isRequired,
  onPreviewFileClick: PropTypes.func.isRequired,
  selectedFileUrl: PropTypes.string
};

WikimediaFilesViewer.defaultProps = {
  isLoading: false,
  selectedFileUrl: null
};

export default memo(WikimediaFilesViewer);
