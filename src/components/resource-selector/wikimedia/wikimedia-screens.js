import { message } from 'antd';
import PropTypes from 'prop-types';
import urlUtils from '../../../utils/url-utils.js';
import { useIsMounted } from '../../../ui/hooks.js';
import { useService } from '../../container-context.js';
import { ensureIsUnique } from '../../../utils/array-utils.js';
import WikimediaSearchScreen from './wikimedia-search-screen.js';
import ResourcePreviewScreen from '../shared/resource-preview-screen.js';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import WikimediaApiClient from '../../../api-clients/wikimedia-api-client.js';
import { ALLOWED_WIKIMEDIA_RESOURCE_TYPES, mapResourceTypesToWikimediaApiFileTypes, processWikimediaResponse } from '../../../utils/wikimedia-utils.js';

const SCREEN = {
  search: 'search',
  preview: 'preview'
};

function WikimediaScreens({ initialUrl, onSelect, onCancel }) {
  const wikimediaApiClient = useService(WikimediaApiClient);

  const isMounted = useIsMounted();
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nextSearchOffset, setNextSearchOffset] = useState(0);
  const [highlightedFile, setHighlightedFile] = useState(null);
  const [screenStack, setScreenStack] = useState([SCREEN.search]);
  const [showInitialFileHighlighting, setShowInitialFileHighlighting] = useState(true);
  const [searchParams, setSearchParams] = useState({ searchTerm: '', searchResourceTypes: Object.values(ALLOWED_WIKIMEDIA_RESOURCE_TYPES) });

  const screen = screenStack[screenStack.length - 1];
  const pushScreen = newScreen => setScreenStack(oldVal => oldVal[oldVal.length - 1] !== newScreen ? [...oldVal, newScreen] : oldVal);
  const popScreen = () => setScreenStack(oldVal => oldVal.length > 1 ? oldVal.slice(0, -1) : oldVal);

  const fetchWikimediaFiles = useCallback(async ({ searchTerm, searchResourceTypes }, searchOffset) => {
    if (!isMounted.current) {
      return;
    }

    try {
      setIsLoading(true);
      const fileTypes = mapResourceTypesToWikimediaApiFileTypes(searchResourceTypes);
      const response = await wikimediaApiClient.queryMediaFiles({
        searchText: searchTerm,
        offset: searchOffset,
        fileTypes
      });

      const result = processWikimediaResponse(response);
      if (isMounted.current) {
        setNextSearchOffset(result.canContinue ? result.nextOffset : 0);
        setFiles(previousFiles => {
          return searchOffset !== 0
            ? ensureIsUnique([...previousFiles, ...result.files], file => file.url)
            : result.files;
        });
      }
    } catch (err) {
      message.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [wikimediaApiClient, isMounted]);

  const handleLoadMore = () => {
    fetchWikimediaFiles(searchParams, nextSearchOffset);
  };

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
    pushScreen(SCREEN.preview);
  };

  const handleOpenWikimediaPageClick = file => {
    window.open(file.pageUrl, '_blank');
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
    setNextSearchOffset(0);
    fetchWikimediaFiles(searchParams, 0);
  }, [fetchWikimediaFiles, searchParams]);

  return (
    <Fragment>
      <WikimediaSearchScreen
        files={files}
        isLoading={isLoading}
        initialUrl={initialUrl}
        onCancelClick={onCancel}
        onLoadMore={handleLoadMore}
        searchParams={searchParams}
        onFileClick={handleFileClick}
        highlightedFile={highlightedFile}
        isHidden={screen !== SCREEN.search}
        canLoadMore={nextSearchOffset !== 0}
        onFileDoubleClick={handleFileDoubleClick}
        onPreviewFileClick={handlePreviewFileClick}
        onSearchParamsChange={handleSearchParamsChange}
        onSelectInitialUrlClick={handleSelectInitialUrlClick}
        onOpenWikimediaPageClick={handleOpenWikimediaPageClick}
        onSelectHighlightedFileClick={handleSelectHighlightedFileClick}
        />

      {screen === SCREEN.preview && (
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

WikimediaScreens.propTypes = {
  initialUrl: PropTypes.string,
  onCancel: PropTypes.func,
  onSelect: PropTypes.func
};

WikimediaScreens.defaultProps = {
  initialUrl: null,
  onCancel: () => {},
  onSelect: () => {}
};

export default WikimediaScreens;
