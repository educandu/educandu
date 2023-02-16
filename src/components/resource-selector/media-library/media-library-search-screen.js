import PropTypes from 'prop-types';
import classNames from 'classnames';
import reactDropzoneNs from 'react-dropzone';
import { useUser } from '../../user-context.js';
import React, { useRef, useState } from 'react';
import { Alert, Button, Divider, Spin } from 'antd';
import { Trans, useTranslation } from 'react-i18next';
import UploadIcon from '../../icons/general/upload-icon.js';
import FilesGridViewer from '../shared/files-grid-viewer.js';
import ActionInvitation from '../shared/action-invitation.js';
import ResourceSearchBar from '../shared/resource-search-bar.js';
import { CloudUploadOutlined, SearchOutlined } from '@ant-design/icons';
import SelectedResourceDisplay from '../shared/selected-resource-display.js';
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
    if (isLoading) {
      return <Alert type="info" message={t('common:searchOngoing')} showIcon />;
    }

    if (searchParams.searchTerm) {
      const messageParams = { resultCount: files.length, searchTerm: searchParams.searchTerm };
      const message = <Trans t={t} i18nKey="common:searchResultInfo" values={messageParams} />;
      return <Alert type="info" message={message} showIcon />;
    }

    return null;
  };

  const getFilesViewerClasses = isDragActive => classNames(
    'MediaLibrarySearchScreen-filesViewer',
    { 'is-dropping': isDragActive && !isLoading },
    { 'is-drop-rejected': isDragActive && isLoading }
  );

  const getNoSearchClasses = isDragActive => classNames(
    'MediaLibrarySearchScreen-noSearch',
    { 'is-dropping': isDragActive && !isLoading },
    { 'is-drop-rejected': isDragActive && isLoading }
  );

  return (
    <div className={classNames('MediaLibrarySearchScreen', { 'is-hidden': isHidden })}>
      <div className="u-resource-selector-screen">
        <div className="MediaLibrarySearchScreen-searchBar">
          <ResourceSearchBar
            isLoading={isLoading}
            initialSearchParams={searchParams}
            allowedResourceTypes={ALLOWED_MEDIA_LIBRARY_RESOURCE_TYPES}
            onSearch={handleSearch}
            />
        </div>
        {currentScreen === SCREEN.search && (
          <div className="MediaLibrarySearchScreen-searchContent u-resource-selector-screen-content">

            <ReactDropzone ref={dropzoneRef} noClick noKeyboard onDrop={fs => fs.length && onFileDrop(fs[0])}>
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

          </div>
        )}
        {currentScreen === SCREEN.search && renderSearchInfo()}

        {currentScreen !== SCREEN.search && (
          <ReactDropzone ref={dropzoneRef} noClick noKeyboard onDrop={fs => fs.length && onFileDrop(fs[0])}>
            {({ getRootProps, getInputProps, isDragActive }) => (
              <div {...getRootProps({ className: getNoSearchClasses(isDragActive) })}>
                <div className="MediaLibrarySearchScreen-noSearchContent">
                  <input {...getInputProps()} hidden />
                  {!!initialUrl && (
                  <SelectedResourceDisplay urlOrFile={initialUrl} footer={t('common:useSearchToChangeFile')} />
                  )}
                  {!initialUrl && (
                    <ActionInvitation
                      icon={<SearchOutlined />}
                      title={t('searchInvitationHeader')}
                      subtitle={t('common:searchInvitationDescription')}
                      />
                  )}
                  <div className="MediaLibrarySearchScreen-noSearchDivider">
                    <Divider plain>{t('common:or')}</Divider>
                  </div>
                  <ActionInvitation
                    icon={<CloudUploadOutlined />}
                    title={initialUrl ? t('common:dropDifferentFileInvitation') : t('common:dropFileInvitation')}
                    subtitle={(
                      <Button type="primary" onClick={handleUploadButtonClick}>
                        {t('common:browseFilesButtonLabel')}
                      </Button>
                    )}
                    />
                </div>
              </div>
            )}
          </ReactDropzone>
        )}
        <div className={currentScreen === SCREEN.search ? 'u-resource-selector-screen-footer' : 'u-resource-selector-screen-footer-right-aligned'}>
          {currentScreen === SCREEN.search && (
            <Button onClick={handleUploadButtonClick} icon={<UploadIcon />}>{t('uploadFile')}</Button>
          )}
          <div className="u-resource-selector-screen-footer-buttons">
            <Button onClick={onCancelClick}>{t('common:cancel')}</Button>
            <Button type="primary" onClick={handleSelectClick} disabled={!canSelectUrl}>{t('common:select')}</Button>
          </div>
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
