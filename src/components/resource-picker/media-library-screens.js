import { message } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import urlUtils from '../../utils/url-utils.js';
import { useIsMounted } from '../../ui/hooks.js';
import MediaLibrarySearch from './media-library-search.js';
import ResourcePreviewScreen from './resource-preview-screen.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { confirmMediaFileHardDelete } from '../confirmation-dialogs.js';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import MediaLibraryApiClient from '../../api-clients/media-library-api-client.js';
import { mapSearchFileTypesToResourceTypes, MEDIA_LIBRARY_SEARCH_FILE_TYPE } from '../../utils/media-library-utils.js';

const SCREEN = {
  search: 'search',
  fileUpload: 'file-upload',
  filePreview: 'file-preview'
};

function MediaLibraryScreens({ initialUrl, onSelect, onCancel }) {
  const { t } = useTranslation();
  const isMounted = useIsMounted();
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedFile, setHighlightedFile] = useState(null);
  const [screenStack, setScreenStack] = useState([SCREEN.search]);
  const mediaLibraryApiClient = useSessionAwareApiClient(MediaLibraryApiClient);
  const [showInitialFileHighlighting, setShowInitialFileHighlighting] = useState(true);
  const [searchParams, setSearchParams] = useState({ searchTerm: '', searchFileTypes: Object.values(MEDIA_LIBRARY_SEARCH_FILE_TYPE) });

  const screen = screenStack[screenStack.length - 1];
  const pushScreen = newScreen => setScreenStack(oldVal => oldVal[oldVal.length - 1] !== newScreen ? [...oldVal, newScreen] : oldVal);
  const popScreen = () => setScreenStack(oldVal => oldVal.length > 1 ? oldVal.slice(0, -1) : oldVal);

  const queryMediaLibraryItems = useCallback(async ({ searchTerm, searchFileTypes }) => {
    if (!isMounted.current) {
      return;
    }

    try {
      setIsLoading(true);
      const resourceTypes = mapSearchFileTypesToResourceTypes(searchFileTypes);
      const foundItems = await mediaLibraryApiClient.queryMediaLibraryItems({ query: searchTerm, resourceTypes });
      if (isMounted.current) {
        setFiles(foundItems);
      }
    } catch (err) {
      message.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [mediaLibraryApiClient, isMounted]);

  const handleFileClick = newFile => {
    setShowInitialFileHighlighting(false);
    setHighlightedFile(oldFile => oldFile?.url === newFile.url ? null : newFile);
  };

  const handleFileDoubleClick = newFile => {
    onSelect(newFile.url);
  };

  const handleSelectInitialUrlClick = () => {
    onSelect(initialUrl);
  };

  const handleSelectHighlightedFileClick = () => {
    onSelect(highlightedFile.url);
  };

  const handlePreviewFileClick = () => {
    pushScreen(SCREEN.filePreview);
  };

  const handleDeleteFileClick = file => {
    confirmMediaFileHardDelete(t, file.displayName, async () => {
      await mediaLibraryApiClient.deleteMediaLibraryItem({ mediaLibraryItemId: file._id });
      setFiles(oldItems => oldItems.filter(item => item._id !== file._id));
      setHighlightedFile(oldFile => oldFile._id !== file._id ? oldFile : null);
    });
  };

  const handleScreenBackClick = () => {
    popScreen();
  };

  const handleSearchParamsChange = newSearchParams => {
    setSearchParams(newSearchParams);
  };

  useEffect(() => {
    if (!highlightedFile || screen !== SCREEN.search) {
      return;
    }

    const previouslyHighlightedFileStillExists = files.some(file => file.url === highlightedFile.url);
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
      <MediaLibrarySearch
        files={files}
        isLoading={isLoading}
        initialUrl={initialUrl}
        onCancelClick={onCancel}
        searchParams={searchParams}
        onFileClick={handleFileClick}
        highlightedFile={highlightedFile}
        isHidden={screen !== SCREEN.search}
        onFileDoubleClick={handleFileDoubleClick}
        onDeleteFileClick={handleDeleteFileClick}
        onPreviewFileClick={handlePreviewFileClick}
        onSearchParamsChange={handleSearchParamsChange}
        onSelectInitialUrlClick={handleSelectInitialUrlClick}
        onSelectHighlightedFileClick={handleSelectHighlightedFileClick}
        />
      {screen === SCREEN.fileUpload && (
        <div>TODO</div>
      )}
      {screen === SCREEN.filePreview && (
        <ResourcePreviewScreen
          file={highlightedFile}
          onCancelClick={onCancel}
          onBackClick={handleScreenBackClick}
          onSelectClick={handleSelectHighlightedFileClick}
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
