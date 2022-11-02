import { message } from 'antd';
import PropTypes from 'prop-types';
import PreviewScreen from './resource-preview-screen.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import WikimediaCommonsSearch from './wikimedia-commons-search.js';
import { getResourceFullName } from '../../utils/resource-utils.js';
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import WikimediaCommonsApiClient from '../../api-clients/wikimedia-commons-api-client.js';
import { mapSearchFileTypesToWikimediaCommonsFileTypes, processWikimediaResponse, SEARCH_FILE_TYPE } from './wikimedia-commons-utils.js';

const SCREEN = {
  search: 'search',
  filePreview: 'file-preview'
};

function WikimediaCommonsScreens({ initialUrl, onSelect, onCancel }) {
  const wikimediaCommonsApiClient = useSessionAwareApiClient(WikimediaCommonsApiClient);

  const isMounted = useRef(false);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedFile, setHighlightedFile] = useState(null);
  const [screenStack, setScreenStack] = useState([SCREEN.search]);
  const [showInitialFileHighlighting, setShowInitialFileHighlighting] = useState(true);
  const [searchParams, setSearchParams] = useState({ searchTerm: '', searchFileTypes: Object.values(SEARCH_FILE_TYPE) });

  const screen = screenStack[screenStack.length - 1];
  const pushScreen = newScreen => setScreenStack(oldVal => oldVal[oldVal.length - 1] !== newScreen ? [...oldVal, newScreen] : oldVal);
  const popScreen = () => setScreenStack(oldVal => oldVal.length > 1 ? oldVal.slice(0, -1) : oldVal);

  const fetchWikimediaFiles = useCallback(async ({ searchTerm, searchFileTypes }) => {
    if (!isMounted.current) {
      return;
    }

    try {
      setIsLoading(true);
      const fileTypes = mapSearchFileTypesToWikimediaCommonsFileTypes(searchFileTypes);
      const result = await wikimediaCommonsApiClient.queryMediaFiles({ searchText: searchTerm, fileTypes });
      if (isMounted.current) {
        setFiles(processWikimediaResponse(result).files);
      }
    } catch (err) {
      message.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [wikimediaCommonsApiClient, isMounted]);

  const handleFileClick = newFile => {
    setShowInitialFileHighlighting(false);
    setHighlightedFile(oldFile => oldFile?.url === newFile.url ? null : newFile);
  };

  const handleFileDoubleClick = newFile => {
    onSelect(newFile.url);
  };

  const handleSelectHighlightedFileClick = () => {
    onSelect(highlightedFile.url);
  };

  const handlePreviewFileClick = () => {
    pushScreen(SCREEN.filePreview);
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

    const initialResourceName = getResourceFullName(initialUrl);

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
    fetchWikimediaFiles(searchParams);
  }, [fetchWikimediaFiles, searchParams]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return (
    <Fragment>
      {screen === SCREEN.search && (
        <WikimediaCommonsSearch
          files={files}
          isLoading={isLoading}
          searchParams={searchParams}
          highlightedFile={highlightedFile}
          onCancelClick={onCancel}
          onFileClick={handleFileClick}
          onFileDoubleClick={handleFileDoubleClick}
          onPreviewFileClick={handlePreviewFileClick}
          onSearchParamsChange={handleSearchParamsChange}
          onSelectHighlightedFileClick={handleSelectHighlightedFileClick}
          />
      )}

      {screen === SCREEN.filePreview && (
        <PreviewScreen
          file={highlightedFile}
          onCancelClick={onCancel}
          onBackClick={handleScreenBackClick}
          onSelectClick={handleSelectHighlightedFileClick}
          />
      )}
    </Fragment>
  );
}

WikimediaCommonsScreens.propTypes = {
  initialUrl: PropTypes.string,
  onCancel: PropTypes.func,
  onSelect: PropTypes.func
};

WikimediaCommonsScreens.defaultProps = {
  initialUrl: null,
  onCancel: () => {},
  onSelect: () => {}
};

export default WikimediaCommonsScreens;
