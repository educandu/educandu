import { message } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import urlUtils from '../../../utils/url-utils.js';
import { useIsMounted } from '../../../ui/hooks.js';
import { replaceItem } from '../../../utils/array-utils.js';
import MediaLibraryEditScreen from './media-library-edit-screen.js';
import { useSessionAwareApiClient } from '../../../ui/api-helper.js';
import MediaLibrarySearchScreen from './media-library-search-screen.js';
import MediaLibraryUploadScreen from './media-library-upload-screen.js';
import ResourcePreviewScreen from '../shared/resource-preview-screen.js';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { confirmMediaFileHardDelete } from '../../confirmation-dialogs.js';
import MediaLibraryApiClient from '../../../api-clients/media-library-api-client.js';
import { ALLOWED_MEDIA_LIBRARY_RESOURCE_TYPES } from '../../../utils/media-library-utils.js';

const SCREEN = {
  search: 'search',
  upload: 'upload',
  preview: 'preview',
  edit: 'edit'
};

function MediaLibraryScreens({ initialUrl, onSelect, onCancel }) {
  const { t } = useTranslation();
  const isMounted = useIsMounted();
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [highlightedFile, setHighlightedFile] = useState(null);
  const [screenStack, setScreenStack] = useState([SCREEN.search]);
  const mediaLibraryApiClient = useSessionAwareApiClient(MediaLibraryApiClient);
  const [showInitialFileHighlighting, setShowInitialFileHighlighting] = useState(true);
  const [searchParams, setSearchParams] = useState({ searchTerm: '', searchResourceTypes: ALLOWED_MEDIA_LIBRARY_RESOURCE_TYPES });

  const screen = screenStack[screenStack.length - 1];
  const pushScreen = newScreen => setScreenStack(oldVal => oldVal[oldVal.length - 1] !== newScreen ? [...oldVal, newScreen] : oldVal);
  const popScreen = () => setScreenStack(oldVal => oldVal.length > 1 ? oldVal.slice(0, -1) : oldVal);

  const queryMediaLibraryItems = useCallback(async ({ searchTerm, searchResourceTypes }) => {
    if (!isMounted.current) {
      return;
    }

    try {
      setIsLoading(true);
      const foundItems = await mediaLibraryApiClient.queryMediaLibraryItems({ query: searchTerm, resourceTypes: searchResourceTypes });
      if (isMounted.current) {
        setFiles(foundItems);
      }
    } catch (err) {
      message.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [mediaLibraryApiClient, isMounted]);

  const handleFileDrop = file => {
    setFileToUpload(file);
    pushScreen(SCREEN.upload);
  };

  const handleFileClick = newFile => {
    setShowInitialFileHighlighting(false);
    setHighlightedFile(oldFile => oldFile?.portableUrl === newFile.portableUrl ? null : newFile);
  };

  const handleFileDoubleClick = newFile => {
    onSelect(newFile.portableUrl);
  };

  const handleSelectInitialUrlClick = () => {
    onSelect(initialUrl);
  };

  const handleSelectHighlightedFileClick = () => {
    onSelect(highlightedFile.portableUrl);
  };

  const handleSelectNewUrl = newUrl => {
    onSelect(newUrl);
  };

  const handleDeleteFileClick = file => {
    confirmMediaFileHardDelete(t, file.displayName, async () => {
      await mediaLibraryApiClient.deleteMediaLibraryItem({ mediaLibraryItemId: file._id });
      setFiles(oldItems => oldItems.filter(item => item.portableUrl !== file.portableUrl));
      setHighlightedFile(oldFile => oldFile.portableUrl !== file.portableUrl ? oldFile : null);
    });
  };

  const handleEditFileClick = () => {
    pushScreen(SCREEN.edit);
  };

  const handlePreviewFileClick = () => {
    pushScreen(SCREEN.preview);
  };

  const handleScreenBackClick = () => {
    popScreen();
  };

  const handleSaveEditedMetadataClick = async ({ description, languages, licenses, tags }) => {
    const editedFile = await mediaLibraryApiClient.updateMediaLibraryItem({
      mediaLibraryItemId: highlightedFile._id, description, languages, licenses, tags
    });
    const oldFile = files.find(file => file._id === editedFile._id);
    const newFile = { ...oldFile, ...editedFile };

    const newFiles = replaceItem(files, newFile);
    setFiles(newFiles);
    setHighlightedFile(newFile);

    message.success(t('common:changesSavedSuccessfully'));
    popScreen();
  };

  const handleSearchParamsChange = newSearchParams => {
    setSearchParams(newSearchParams);
  };

  useEffect(() => {
    if (screen !== SCREEN.upload) {
      setFileToUpload(null);
    }

    if (!highlightedFile || screen !== SCREEN.search) {
      return;
    }

    const previouslyHighlightedFileStillExists = files.some(file => file.portableUrl === highlightedFile.portableUrl);
    if (!previouslyHighlightedFileStillExists) {
      setHighlightedFile(null);
    }
  }, [screen, searchParams.searchTerm, highlightedFile, files]);

  useEffect(() => {
    if (!files.length || !showInitialFileHighlighting) {
      return;
    }

    const initialResourceName = urlUtils.getFileName(initialUrl);

    if (initialResourceName) {
      const preSelectedFile = files.find(file => file.displayName === initialResourceName);
      setHighlightedFile(preSelectedFile);
    }
  }, [initialUrl, showInitialFileHighlighting, files]);

  useEffect(() => {
    if (!searchParams.searchTerm) {
      return;
    }

    setFiles([]);
    queryMediaLibraryItems(searchParams);
  }, [queryMediaLibraryItems, searchParams]);

  return (
    <Fragment>
      <MediaLibrarySearchScreen
        files={files}
        isLoading={isLoading}
        initialUrl={initialUrl}
        searchParams={searchParams}
        highlightedFile={highlightedFile}
        isHidden={screen !== SCREEN.search}
        onCancelClick={onCancel}
        onFileDrop={handleFileDrop}
        onFileClick={handleFileClick}
        onFileDoubleClick={handleFileDoubleClick}
        onEditFileClick={handleEditFileClick}
        onDeleteFileClick={handleDeleteFileClick}
        onPreviewFileClick={handlePreviewFileClick}
        onSearchParamsChange={handleSearchParamsChange}
        onSelectInitialUrlClick={handleSelectInitialUrlClick}
        onSelectHighlightedFileClick={handleSelectHighlightedFileClick}
        />
      {screen === SCREEN.upload && (
        <MediaLibraryUploadScreen
          initialFile={fileToUpload}
          onCancelClick={onCancel}
          onBackClick={handleScreenBackClick}
          onSelectNewUrl={handleSelectNewUrl}
          />
      )}
      {screen === SCREEN.preview && (
        <ResourcePreviewScreen
          file={highlightedFile}
          renderMediaLibraryMetadata
          onCancelClick={onCancel}
          onBackClick={handleScreenBackClick}
          onSelectClick={handleSelectHighlightedFileClick}
          />
      )}
      {screen === SCREEN.edit && (
        <MediaLibraryEditScreen
          file={highlightedFile}
          renderMediaLibraryMetadata
          onCancelClick={onCancel}
          onBackClick={handleScreenBackClick}
          onSaveClick={handleSaveEditedMetadataClick}
          />
      )}
    </Fragment>
  );
}

MediaLibraryScreens.propTypes = {
  initialUrl: PropTypes.string,
  onCancel: PropTypes.func,
  onSelect: PropTypes.func
};

MediaLibraryScreens.defaultProps = {
  initialUrl: null,
  onCancel: () => {},
  onSelect: () => {}
};

export default MediaLibraryScreens;
