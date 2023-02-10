import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Alert, Button, Spin } from 'antd';
import reactDropzoneNs from 'react-dropzone';
import NoSearch from '../shared/no-search.js';
import { useUser } from '../../user-context.js';
import FilesGridViewer from '../files-grid-viewer.js';
import { Trans, useTranslation } from 'react-i18next';
import React, { Fragment, useRef, useState } from 'react';
import { SOURCE_TYPE } from '../../../domain/constants.js';
import UploadIcon from '../../icons/general/upload-icon.js';
import ResourceSearchBar from '../shared/resource-search-bar.js';
import permissions, { hasUserPermission } from '../../../domain/permissions.js';
import { mediaLibraryItemWithRelevanceShape } from '../../../ui/default-prop-types.js';
import { ALLOWED_MEDIA_LIBRARY_RESOURCE_TYPES } from '../../../utils/media-library-utils.js';

const ReactDropzone = reactDropzoneNs.default || reactDropzoneNs;

const SCREEN = {
  search: 'search',
  searchInvitation: 'search-invitation',
  initialUrlPreview: 'initial-url-preview'
};

function MediaLibrarySearchScreen({
  files,
  isHidden,
  isLoading,
  initialUrl,
  searchParams,
  highlightedFile,
  onFileDrop,
  onFileClick,
  onCancelClick,
  onFileDoubleClick,
  onDeleteFileClick,
  onPreviewFileClick,
  onSearchParamsChange,
  onSelectInitialUrlClick,
  onSelectHighlightedFileClick
}) {
  const user = useUser();
  const dropzoneRef = useRef();
  const { t } = useTranslation('mediaLibrarySearchScreen');
  const [hasSearchedAtLeastOnce, setHasSearchedAtLeastOnce] = useState(false);

  let currentScreen;
  let canSelectUrl;
  if (hasSearchedAtLeastOnce) {
    currentScreen = SCREEN.search;
    canSelectUrl = !!highlightedFile;
  } else if (initialUrl) {
    currentScreen = SCREEN.initialUrlPreview;
    canSelectUrl = true;
  } else {
    currentScreen = SCREEN.searchInvitation;
    canSelectUrl = false;
  }

  const handleSearch = newSearchParams => {
    setHasSearchedAtLeastOnce(true);
    onSearchParamsChange(newSearchParams);
  };

  const handleSelectClick = () => {
    switch (currentScreen) {
      case SCREEN.search:
        return onSelectHighlightedFileClick();
      case SCREEN.initialUrlPreview:
        return onSelectInitialUrlClick();
      default:
        throw new Error('No file selected');
    }
  };

  const handleUploadButtonClick = () => {
    dropzoneRef.current.open();
  };

  const renderSearchInfo = () => {
    let searchMessage;
    if (isLoading) {
      searchMessage = t('common:searchOngoing');
    } else if (searchParams.searchTerm) {
      searchMessage = (
        <Trans
          t={t}
          i18nKey="common:searchResultInfo"
          values={{ resultCount: files.length, searchTerm: searchParams.searchTerm }}
          components={[<i key="0" />]}
          />
      );
    } else {
      searchMessage = null;
    }

    return searchMessage ? <Alert type="info" message={searchMessage} showIcon /> : null;
  };

  const getFilesViewerClasses = isDragActive => classNames({
    'MediaLibrarySearchScreen-filesViewer': true,
    'u-can-drop': isDragActive && !isLoading,
    'u-cannot-drop': isDragActive && !!isLoading
  });

  return (
    <div className={classNames('MediaLibrarySearchScreen', { 'is-hidden': isHidden })}>
      <ResourceSearchBar
        isLoading={isLoading}
        initialSearchParams={searchParams}
        allowedResourceTypes={ALLOWED_MEDIA_LIBRARY_RESOURCE_TYPES}
        onSearch={handleSearch}
        />
      {currentScreen === SCREEN.search && (
        <Fragment>
          <ReactDropzone
            ref={dropzoneRef}
            onDrop={fs => fs.length && onFileDrop(fs[0])}
            noKeyboard
            noClick
            >
            {({ getRootProps, getInputProps, isDragActive }) => (
              <div {...getRootProps({ className: getFilesViewerClasses(isDragActive) })}>
                <input {...getInputProps()} hidden />
                <div className="MediaLibrarySearchScreen-filesViewerContent">
                  <FilesGridViewer
                    files={files}
                    selectedFileUrl={highlightedFile?.portableUrl}
                    canDelete={hasUserPermission(user, permissions.DELETE_ANY_STORAGE_FILE)}
                    onFileClick={onFileClick}
                    onFileDoubleClick={onFileDoubleClick}
                    onDeleteFileClick={onDeleteFileClick}
                    onPreviewFileClick={onPreviewFileClick}
                    />
                </div>
                {!!isLoading && (
                <div className={classNames('MediaLibrarySearchScreen-filesViewerOverlay')}>
                  <Spin size="large" />
                </div>
                )}
              </div>
            )}
          </ReactDropzone>
          <div className="MediaLibrarySearchScreen-searchInfo">
            {renderSearchInfo()}
          </div>
        </Fragment>
      )}
      {currentScreen !== SCREEN.search && (
        <div className="MediaLibrarySearchScreen-noSearch">
          <NoSearch sourceType={SOURCE_TYPE.mediaLibrary} url={initialUrl} onFileDrop={onFileDrop} />
        </div>
      )}
      <div className={currentScreen === SCREEN.search ? 'u-resource-picker-screen-footer' : 'u-resource-picker-screen-footer-right-aligned'}>
        {currentScreen === SCREEN.search && (
          <Button onClick={handleUploadButtonClick} icon={<UploadIcon />}>{t('uploadFile')}</Button>
        )}
        <div className="u-resource-picker-screen-footer-buttons">
          <Button onClick={onCancelClick}>{t('common:cancel')}</Button>
          <Button type="primary" onClick={handleSelectClick} disabled={!canSelectUrl}>{t('common:select')}</Button>
        </div>
      </div>
    </div>
  );
}

MediaLibrarySearchScreen.propTypes = {
  files: PropTypes.arrayOf(mediaLibraryItemWithRelevanceShape).isRequired,
  highlightedFile: mediaLibraryItemWithRelevanceShape,
  initialUrl: PropTypes.string,
  isHidden: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
  searchParams: PropTypes.shape({
    searchTerm: PropTypes.string.isRequired,
    searchResourceTypes: PropTypes.arrayOf(PropTypes.oneOf(ALLOWED_MEDIA_LIBRARY_RESOURCE_TYPES)).isRequired
  }).isRequired,
  onFileDrop: PropTypes.func.isRequired,
  onFileClick: PropTypes.func.isRequired,
  onCancelClick: PropTypes.func.isRequired,
  onFileDoubleClick: PropTypes.func.isRequired,
  onDeleteFileClick: PropTypes.func.isRequired,
  onPreviewFileClick: PropTypes.func.isRequired,
  onSearchParamsChange: PropTypes.func.isRequired,
  onSelectInitialUrlClick: PropTypes.func.isRequired,
  onSelectHighlightedFileClick: PropTypes.func.isRequired
};

MediaLibrarySearchScreen.defaultProps = {
  highlightedFile: null,
  initialUrl: null
};

export default MediaLibrarySearchScreen;
