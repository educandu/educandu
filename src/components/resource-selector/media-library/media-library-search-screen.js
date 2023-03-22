import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button, Spin } from 'antd';
import reactDropzoneNs from 'react-dropzone';
import CustomAlert from '../../custom-alert.js';
import { useUser } from '../../user-context.js';
import { Trans, useTranslation } from 'react-i18next';
import UploadIcon from '../../icons/general/upload-icon.js';
import FilesGridViewer from '../shared/files-grid-viewer.js';
import MediaLibraryOptions from './media-library-options.js';
import ActionInvitation from '../shared/action-invitation.js';
import ResourceSearchBar from '../shared/resource-search-bar.js';
import { SEARCH_RESOURCE_TYPE } from '../../../domain/constants.js';
import { useSessionAwareApiClient } from '../../../ui/api-helper.js';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import { CloudUploadOutlined, SearchOutlined } from '@ant-design/icons';
import SelectedResourceDisplay from '../shared/selected-resource-display.js';
import MediaLibraryMetadataDisplay from './media-library-metadata-display.js';
import permissions, { hasUserPermission } from '../../../domain/permissions.js';
import MediaLibraryApiClient from '../../../api-clients/media-library-api-client.js';
import { mediaLibraryItemWithRelevanceShape } from '../../../ui/default-prop-types.js';

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
  onEditFileClick,
  onPreviewFileClick,
  onSearchParamsChange,
  onSelectInitialUrlClick,
  onSelectHighlightedFileClick
}) {
  const user = useUser();
  const dropzoneRef = useRef();
  const { t } = useTranslation('mediaLibrarySearchScreen');
  const mediaLibraryApiClient = useSessionAwareApiClient(MediaLibraryApiClient);

  const [hasSearchedAtLeastOnce, setHasSearchedAtLeastOnce] = useState(false);
  const [initialMediaLibraryItem, setInitialMediaLibraryItem] = useState(null);

  useEffect(() => {
    if (!initialUrl) {
      return;
    }

    (async () => {
      const item = await mediaLibraryApiClient.findMediaLibraryItem({ url: initialUrl });
      setInitialMediaLibraryItem(item);
    })();
  }, [initialUrl, mediaLibraryApiClient]);

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
      return <CustomAlert message={t('common:searchOngoing')} />;
    }

    if (searchParams.searchTerm) {
      const messageParams = { resultCount: files.length, searchTerm: searchParams.searchTerm };
      const message = <Trans t={t} i18nKey="common:searchResultInfo" values={messageParams} />;
      return <CustomAlert message={message} />;
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
          <ResourceSearchBar isLoading={isLoading} initialSearchParams={searchParams} onSearch={handleSearch} />
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
                      canEdit
                      canDelete={hasUserPermission(user, permissions.MANAGE_PUBLIC_CONTENT)}
                      onFileClick={onFileClick}
                      onFileDoubleClick={onFileDoubleClick}
                      onDeleteFileClick={onDeleteFileClick}
                      onEditFileClick={onEditFileClick}
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
                <MediaLibraryOptions
                  option1={
                    <Fragment>
                      <input {...getInputProps()} hidden />
                      {!!initialUrl && (
                        <SelectedResourceDisplay
                          urlOrFile={initialUrl}
                          metadata={!!initialMediaLibraryItem && (
                            <MediaLibraryMetadataDisplay mediaLibraryItem={initialMediaLibraryItem} />
                          )}
                          footer={t('common:useSearchToChangeFile')}
                          />
                      )}
                      {!initialUrl && (
                        <ActionInvitation
                          icon={<SearchOutlined />}
                          title={t('searchInvitationHeader')}
                          subtitle={t('common:searchInvitationDescription')}
                          />
                      )}
                    </Fragment>
                  }
                  option2={
                    <ActionInvitation
                      icon={<CloudUploadOutlined />}
                      title={initialUrl ? t('common:dropDifferentFileInvitation') : t('common:dropFileInvitation')}
                      subtitle={(
                        <Button onClick={handleUploadButtonClick}>
                          {t('common:browseFilesButtonLabel')}
                        </Button>
                      )}
                      />
                  }
                  />
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
            <Button onClick={handleSelectClick} disabled={!canSelectUrl}>{t('common:select')}</Button>
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
    searchResourceType: PropTypes.oneOf(Object.values(SEARCH_RESOURCE_TYPE)).isRequired
  }).isRequired,
  onFileDrop: PropTypes.func.isRequired,
  onFileClick: PropTypes.func.isRequired,
  onCancelClick: PropTypes.func.isRequired,
  onFileDoubleClick: PropTypes.func.isRequired,
  onDeleteFileClick: PropTypes.func.isRequired,
  onEditFileClick: PropTypes.func.isRequired,
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
