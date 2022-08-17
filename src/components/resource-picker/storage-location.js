import PropTypes from 'prop-types';
import classNames from 'classnames';
import UsedStorage from '../used-storage.js';
import reactDropzoneNs from 'react-dropzone';
import cloneDeep from '../../utils/clone-deep.js';
import { useService } from '../container-context.js';
import { Trans, useTranslation } from 'react-i18next';
import FileEditorScreen from './file-editor-screen.js';
import UploadIcon from '../icons/general/upload-icon.js';
import FilePreviewScreen from './file-preview-screen.js';
import FilesUploadScreen from './files-upload-screen.js';
import { isTouchDevice } from '../../ui/browser-helper.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { useSetStorageLocation } from '../storage-context.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { Alert, Button, Input, message, Modal, Select } from 'antd';
import { getResourceFullName } from '../../utils/resource-utils.js';
import { getCookie, setSessionCookie } from '../../common/cookie.js';
import { storageLocationShape } from '../../ui/default-prop-types.js';
import { ArrowLeftOutlined, SearchOutlined } from '@ant-design/icons';
import StorageApiClient from '../../api-clients/storage-api-client.js';
import FilesViewer, { FILES_VIEWER_DISPLAY } from '../files-viewer.js';
import { confirmPublicUploadLiability } from '../confirmation-dialogs.js';
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { CDN_OBJECT_TYPE, STORAGE_LOCATION_TYPE } from '../../domain/constants.js';
import { canUploadToPath, getParentPathForStorageLocationPath, getStorageLocationPathForUrl } from '../../utils/storage-utils.js';

const ReactDropzone = reactDropzoneNs.default || reactDropzoneNs;

const { Search } = Input;

const MIN_SEARCH_TERM_LENGTH = 3;

const SCREEN = {
  directory: 'directory',
  search: 'search',
  fileEditor: 'file-editor',
  filePreview: 'file-preview',
  filesUpload: 'files-upload'
};

function StorageLocation({ storageLocation, initialUrl, onSelect, onCancel }) {
  const { t } = useTranslation('storageLocation');
  const setStorageLocation = useSetStorageLocation();
  const { uploadLiabilityCookieName } = useService(ClientConfig);
  const storageApiClient = useSessionAwareApiClient(StorageApiClient);

  const dropzoneRef = useRef();
  const isMounted = useRef(false);
  const [files, setFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [searchResult, setSearchResult] = useState([]);
  const [highlightedFile, setHighlightedFile] = useState(null);
  const [parentDirectory, setParentDirectory] = useState(null);
  const [currentDirectory, setCurrentDirectory] = useState(null);
  const [screenStack, setScreenStack] = useState([SCREEN.directory]);
  const [currentDirectoryPath, setCurrentDirectoryPath] = useState(null);
  const [lastExecutedSearchTerm, setLastExecutedSearchTerm] = useState('');
  const [currentEditedFileIndex, setCurrentEditedFileIndex] = useState(-1);
  const [showInitialFileHighlighting, setShowInitialFileHighlighting] = useState(true);
  const [canUploadToCurrentDirectory, setCanUploadToCurrentDirectory] = useState(false);
  const [filesViewerDisplay, setFilesViewerDisplay] = useState(FILES_VIEWER_DISPLAY.grid);

  const screen = screenStack[screenStack.length - 1];
  const pushScreen = newScreen => setScreenStack(oldVal => oldVal[oldVal.length - 1] !== newScreen ? [...oldVal, newScreen] : oldVal);
  const popScreen = () => setScreenStack(oldVal => oldVal.length > 1 ? oldVal.slice(0, -1) : oldVal);

  const canAcceptFiles = screen === SCREEN.directory && canUploadToCurrentDirectory && !isLoading;

  const fetchStorageContent = useCallback(async searchText => {
    if (!currentDirectoryPath || !isMounted.current) {
      return;
    }

    try {
      setIsLoading(true);
      const result = await storageApiClient.getCdnObjects({
        parentPath: searchText ? storageLocation.rootPath : currentDirectoryPath,
        searchTerm: searchText ?? null,
        recursive: !!searchText
      });

      if (!isMounted.current) {
        return;
      }

      if (searchText) {
        setSearchResult(result.objects);
        setLastExecutedSearchTerm(searchText);
      } else {
        setCanUploadToCurrentDirectory(canUploadToPath(result.currentDirectory.path));
        setParentDirectory(result.parentDirectory);
        setCurrentDirectory(result.currentDirectory);
        setFiles(result.objects);
      }

      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      if (err.status === 404 && !searchText) {
        setCurrentDirectoryPath(storageLocation.homePath);
      } else {
        message.error(err.message);
      }
    }
  }, [currentDirectoryPath, storageLocation.homePath, storageLocation.rootPath, storageApiClient, isMounted]);

  const handleFileClick = newFile => {
    if (newFile.type === CDN_OBJECT_TYPE.file) {
      setShowInitialFileHighlighting(false);
      setHighlightedFile(oldFile => oldFile?.url === newFile.url ? null : newFile);
    }
    if (newFile.type === CDN_OBJECT_TYPE.directory && isTouchDevice()) {
      setCurrentDirectoryPath(newFile.path);
    }
  };

  const handleFileDoubleClick = newFile => {
    if (newFile.type === CDN_OBJECT_TYPE.file) {
      onSelect(newFile.portableUrl);
    }
    if (newFile.type === CDN_OBJECT_TYPE.directory) {
      setCurrentDirectoryPath(newFile.path);
    }
  };

  const handleSelectHighlightedFileClick = () => {
    onSelect(highlightedFile.portableUrl);
  };

  const handleSelectUploadedFileClick = file => {
    onSelect(file.portableUrl);
  };

  const handleDeleteFileClick = async file => {
    const { usedBytes } = await storageApiClient.deleteCdnObject(file.path);
    setFiles(oldItems => oldItems.filter(item => item.portableUrl !== file.portableUrl));
    setSearchResult(oldItems => oldItems.filter(item => item.portableUrl !== file.portableUrl));
    setStorageLocation({ ...cloneDeep(storageLocation), usedBytes });
  };

  const handlePreviewFileClick = () => {
    pushScreen(SCREEN.filePreview);
  };

  const handleUploadButtonClick = () => {
    dropzoneRef.current.open();
  };

  const handleScreenBackClick = () => {
    popScreen();
    setUploadQueue([]);
    setCurrentEditedFileIndex(-1);
  };

  const handleFilesUploadScreenBackClick = async () => {
    handleScreenBackClick();
    await fetchStorageContent();
  };

  const handleSearchTermChange = event => {
    setSearchTerm(event.target.value);
  };

  const handleSearchClick = async () => {
    if (searchTerm.length < MIN_SEARCH_TERM_LENGTH) {
      Modal.error({
        title: t('common:error'),
        content: t('common:searchTextTooShort', { minCharCount: MIN_SEARCH_TERM_LENGTH })
      });

      return;
    }

    pushScreen(SCREEN.search);
    await fetchStorageContent(searchTerm);
  };

  const handleBackToDirectoryScreenClick = () => {
    setLastExecutedSearchTerm('');
    setSearchResult([]);
    setSearchTerm('');
    popScreen();
  };

  const handleEditFileClick = fileIndex => {
    setCurrentEditedFileIndex(fileIndex);
    pushScreen(SCREEN.fileEditor);
  };

  const handleFileEditorScreenApplyClick = newFile => {
    setUploadQueue(queue => queue.map((item, index) => index !== currentEditedFileIndex ? item : { file: newFile, isPristine: false }));
    popScreen();
  };

  const renderSearchInfo = () => {
    const searchMessage = isLoading
      ? t('searchOngoing')
      : (
        <Trans
          t={t}
          i18nKey="searchResultInfo"
          values={{ searchTerm: lastExecutedSearchTerm }}
          components={[<i key="0" />]}
          />
      );

    return <Alert type="info" message={searchMessage} showIcon />;
  };

  const renderStorageInfo = () => {
    if (storageLocation.type === STORAGE_LOCATION_TYPE.private && (storageLocation.usedBytes > 0 || storageLocation.maxBytes > 0)) {
      return <UsedStorage usedBytes={storageLocation.usedBytes} maxBytes={storageLocation.maxBytes} showLabel />;
    }

    if (storageLocation.type === STORAGE_LOCATION_TYPE.public) {
      return <Alert message={t('publicStorageWarning')} type="warning" showIcon />;
    }

    return null;
  };

  useEffect(() => {
    const checkPreconditions = () => {
      return storageLocation.type === STORAGE_LOCATION_TYPE.public
        ? new Promise(resolve => {
          if (!getCookie(uploadLiabilityCookieName)) {
            confirmPublicUploadLiability(t, () => {
              setSessionCookie(uploadLiabilityCookieName, 'true');
              resolve(true);
            }, () => resolve(false));
          } else {
            resolve(true);
          }
        })
        : true;
    };

    const startUpload = async () => {
      if (!uploadQueue.length) {
        return;
      }

      const preMet = await checkPreconditions();
      if (!preMet || !uploadQueue.length) {
        return;
      }

      pushScreen(SCREEN.filesUpload);
    };

    startUpload();

  }, [uploadQueue, storageLocation.type, uploadLiabilityCookieName, t]);

  useEffect(() => {
    if (!highlightedFile) {
      return;
    }

    let collectionToUse;
    switch (screen) {
      case SCREEN.directory:
        collectionToUse = files;
        break;
      case SCREEN.search:
        collectionToUse = searchResult;
        break;
      default:
        collectionToUse = null;
        break;
    }

    if (!collectionToUse) {
      return;
    }

    const previouslyHighlightedFileStillExists = collectionToUse.some(file => file.portableUrl === highlightedFile.portableUrl);
    if (!previouslyHighlightedFileStillExists) {
      setHighlightedFile(null);
    }
  }, [screen, highlightedFile, files, searchResult]);

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
    const initialResourcePath = getStorageLocationPathForUrl(initialUrl);
    const initialResourceParentDirectoryPath = getParentPathForStorageLocationPath(initialResourcePath);

    setCurrentDirectoryPath(initialResourceParentDirectoryPath.startsWith(storageLocation.rootPath)
      ? initialResourceParentDirectoryPath
      : storageLocation.homePath);
  }, [initialUrl, storageLocation.homePath, storageLocation.rootPath]);

  useEffect(() => {
    fetchStorageContent();
  }, [fetchStorageContent]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const getFilesViewerClasses = isDragActive => classNames({
    'StorageLocation-filesViewer': true,
    'u-can-drop': isDragActive && canAcceptFiles,
    'u-cannot-drop': isDragActive && !canAcceptFiles
  });

  return (
    <div className="StorageLocation">
      {(screen === SCREEN.directory || screen === SCREEN.search) && (
        <Fragment>
          <div className="StorageLocation-buttonsLine">
            <div>
              <Search
                placeholder={t('common:search')}
                value={searchTerm}
                onSearch={handleSearchClick}
                onChange={handleSearchTermChange}
                enterButton={<SearchOutlined />}
                />
            </div>
            <div className="StorageLocation-filesViewerSelectContainer">
              <Select
                value={filesViewerDisplay}
                onChange={setFilesViewerDisplay}
                className="StorageLocation-filesViewerSelect"
                options={Object.values(FILES_VIEWER_DISPLAY).map(v => ({ label: t(`filesView_${v}`), value: v }))}
                />
            </div>
          </div>
          <ReactDropzone
            ref={dropzoneRef}
            onDrop={canAcceptFiles ? fs => setUploadQueue(fs.map(f => ({ file: f, isPristine: true }))) : null}
            noKeyboard
            noClick
            >
            {({ getRootProps, getInputProps, isDragActive }) => (
              <div {...getRootProps({ className: getFilesViewerClasses(isDragActive) })}>
                <input {...getInputProps()} hidden />
                <FilesViewer
                  isLoading={isLoading}
                  files={screen === SCREEN.search ? searchResult : files}
                  parentDirectory={screen === SCREEN.search ? null : parentDirectory}
                  display={filesViewerDisplay}
                  onFileClick={handleFileClick}
                  onFileDoubleClick={handleFileDoubleClick}
                  selectedFileUrl={highlightedFile?.portableUrl}
                  onDeleteFileClick={handleDeleteFileClick}
                  onPreviewFileClick={handlePreviewFileClick}
                  onNavigateToParent={() => setCurrentDirectoryPath(getParentPathForStorageLocationPath(currentDirectory.path))}
                  canNavigateToParent={screen === SCREEN.directory && currentDirectory?.path?.length > storageLocation.rootPath.length}
                  canDelete={storageLocation.isDeletionEnabled}
                  />
              </div>
            )}
          </ReactDropzone>
          <div className="StorageLocation-locationInfo">
            {screen === SCREEN.search ? renderSearchInfo() : renderStorageInfo()}
          </div>
          <div className="ResourcePickerScreen-footer">
            {screen === SCREEN.directory && (
              <Button onClick={handleUploadButtonClick} icon={<UploadIcon />} disabled={!canAcceptFiles}>{t('uploadFiles')}</Button>
            )}
            {screen === SCREEN.search && (
              <Button onClick={handleBackToDirectoryScreenClick} icon={<ArrowLeftOutlined />} disabled={isLoading}>{t('backToDirectoryView')}</Button>
            )}
            <div className="ResourcePickerScreen-footerButtons">
              <Button onClick={onCancel}>{t('common:cancel')}</Button>
              <Button type="primary" onClick={handleSelectHighlightedFileClick} disabled={!highlightedFile || isLoading}>{t('common:select')}</Button>
            </div>
          </div>
        </Fragment>
      )}

      {screen === SCREEN.filePreview && (
        <FilePreviewScreen
          file={highlightedFile}
          onCancelClick={onCancel}
          onBackClick={handleScreenBackClick}
          onSelectClick={handleSelectHighlightedFileClick}
          />
      )}

      {screen === SCREEN.filesUpload && (
        <FilesUploadScreen
          uploadQueue={uploadQueue}
          directory={currentDirectory}
          storageLocation={storageLocation}
          onCancelClick={onCancel}
          onEditFileClick={handleEditFileClick}
          onBackClick={handleFilesUploadScreenBackClick}
          onSelectFileClick={handleSelectUploadedFileClick}
          />
      )}

      {screen === SCREEN.fileEditor && (
        <FileEditorScreen
          file={uploadQueue[currentEditedFileIndex].file}
          onCancelClick={onCancel}
          onBackClick={handleScreenBackClick}
          onApplyClick={handleFileEditorScreenApplyClick}
          />
      )}
    </div>
  );
}

StorageLocation.propTypes = {
  initialUrl: PropTypes.string,
  onCancel: PropTypes.func,
  onSelect: PropTypes.func,
  storageLocation: storageLocationShape.isRequired
};

StorageLocation.defaultProps = {
  initialUrl: null,
  onCancel: () => {},
  onSelect: () => {}
};

export default StorageLocation;
