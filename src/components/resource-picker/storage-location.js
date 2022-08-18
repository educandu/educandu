import PropTypes from 'prop-types';
import classNames from 'classnames';
import UsedStorage from '../used-storage.js';
import FilesViewer from '../files-viewer.js';
import reactDropzoneNs from 'react-dropzone';
import { Trans, useTranslation } from 'react-i18next';
import UploadIcon from '../icons/general/upload-icon.js';
import React, { useEffect, useRef, useState } from 'react';
import { isTouchDevice } from '../../ui/browser-helper.js';
import { Alert, Button, Input, Modal, Select } from 'antd';
import { canUploadToPath } from '../../utils/storage-utils.js';
import { ArrowLeftOutlined, SearchOutlined } from '@ant-design/icons';
import { storageLocationShape, cdnObjectShape } from '../../ui/default-prop-types.js';
import { CDN_OBJECT_TYPE, FILES_VIEWER_DISPLAY, STORAGE_LOCATION_TYPE } from '../../domain/constants.js';

const ReactDropzone = reactDropzoneNs.default || reactDropzoneNs;

const { Search } = Input;

const MIN_SEARCH_TERM_LENGTH = 3;

function StorageLocation({
  files,
  isLoading,
  searchTerm,
  currentDirectory,
  currentDirectoryPath,
  parentDirectory,
  highlightedFile,
  storageLocation,
  filesViewerDisplay,
  onSelectFileClick,
  onFileClick,
  onCancelClick,
  onDeleteFileClick,
  onPreviewFileClick,
  onSearchTermChange,
  onFilesViewerDisplayChange,
  onNavigateToParent,
  onFilesDropped,
  onDirectoryClick
}) {
  const { t } = useTranslation('storageLocation');

  const dropzoneRef = useRef();
  const [typedInSearchTerm, setTypedInSearchTerm] = useState(searchTerm);

  useEffect(() => {
    setTypedInSearchTerm(searchTerm);
  }, [searchTerm]);

  const isInSearchMode = !!searchTerm;
  const canAcceptFiles = !isInSearchMode && canUploadToPath(currentDirectoryPath) && !isLoading;

  const handleFileClick = file => {
    if (file.type === CDN_OBJECT_TYPE.file) {
      onFileClick(file);
    }
    if (file.type === CDN_OBJECT_TYPE.directory && isTouchDevice()) {
      onDirectoryClick(file);
    }
  };

  const handleFileDoubleClick = file => {
    if (file.type === CDN_OBJECT_TYPE.file) {
      onSelectFileClick(file.portableUrl);
    }
    if (file.type === CDN_OBJECT_TYPE.directory) {
      onDirectoryClick(file);
    }
  };

  const handleSelectHighlightedFileClick = () => {
    onSelectFileClick(highlightedFile.portableUrl);
  };

  const handleUploadButtonClick = () => {
    dropzoneRef.current.open();
  };

  const handleSearchTermChange = event => {
    setTypedInSearchTerm(event.target.value);
  };

  const handleSearchClick = async () => {
    if (typedInSearchTerm.length < MIN_SEARCH_TERM_LENGTH) {
      Modal.error({
        title: t('common:error'),
        content: t('common:searchTextTooShort', { minCharCount: MIN_SEARCH_TERM_LENGTH })
      });

      return;
    }

    await onSearchTermChange(typedInSearchTerm);
  };

  const handleBackToDirectoryScreenClick = async () => {
    await onSearchTermChange('');
  };

  const renderSearchInfo = () => {
    const searchMessage = isLoading
      ? t('searchOngoing')
      : (
        <Trans
          t={t}
          i18nKey="searchResultInfo"
          values={{ searchTerm }}
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

  const getFilesViewerClasses = isDragActive => classNames({
    'StorageLocation-filesViewer': true,
    'u-can-drop': isDragActive && canAcceptFiles,
    'u-cannot-drop': isDragActive && !canAcceptFiles
  });

  return (
    <div className="StorageLocation">
      <div className="StorageLocation-buttonsLine">
        <div>
          <Search
            placeholder={t('common:search')}
            value={typedInSearchTerm}
            onSearch={handleSearchClick}
            onChange={handleSearchTermChange}
            enterButton={<SearchOutlined />}
            />
        </div>
        <div className="StorageLocation-selectContainer">
          <Select
            value={filesViewerDisplay}
            onChange={onFilesViewerDisplayChange}
            className="StorageLocation-select"
            options={Object.values(FILES_VIEWER_DISPLAY).map(v => ({ label: t(`filesView_${v}`), value: v }))}
            />
        </div>
      </div>
      <ReactDropzone
        ref={dropzoneRef}
        onDrop={canAcceptFiles ? fs => onFilesDropped(fs) : null}
        noKeyboard
        noClick
        >
        {({ getRootProps, getInputProps, isDragActive }) => (
          <div {...getRootProps({ className: getFilesViewerClasses(isDragActive) })}>
            <input {...getInputProps()} hidden />
            <FilesViewer
              isLoading={isLoading}
              files={files}
              parentDirectory={isInSearchMode ? null : parentDirectory}
              display={filesViewerDisplay}
              onFileClick={handleFileClick}
              onFileDoubleClick={handleFileDoubleClick}
              selectedFileUrl={highlightedFile?.portableUrl}
              onDeleteFileClick={onDeleteFileClick}
              onPreviewFileClick={onPreviewFileClick}
              onNavigateToParent={onNavigateToParent}
              canNavigateToParent={!isInSearchMode && currentDirectory?.path?.length > storageLocation.rootPath.length}
              canDelete={storageLocation.isDeletionEnabled}
              />
          </div>
        )}
      </ReactDropzone>
      <div className="StorageLocation-locationInfo">
        {isInSearchMode ? renderSearchInfo() : renderStorageInfo()}
      </div>
      <div className="ResourcePickerScreen-footer">
        {!isInSearchMode && (
          <Button onClick={handleUploadButtonClick} icon={<UploadIcon />} disabled={!canAcceptFiles}>{t('uploadFiles')}</Button>
        )}
        {isInSearchMode && (
          <Button onClick={handleBackToDirectoryScreenClick} icon={<ArrowLeftOutlined />} disabled={isLoading}>{t('backToDirectoryView')}</Button>
        )}
        <div className="ResourcePickerScreen-footerButtons">
          <Button onClick={onCancelClick}>{t('common:cancel')}</Button>
          <Button type="primary" onClick={handleSelectHighlightedFileClick} disabled={!highlightedFile || isLoading}>{t('common:select')}</Button>
        </div>
      </div>
    </div>
  );
}

StorageLocation.propTypes = {
  currentDirectory: cdnObjectShape,
  currentDirectoryPath: PropTypes.string,
  files: PropTypes.arrayOf(cdnObjectShape).isRequired,
  filesViewerDisplay: PropTypes.string.isRequired,
  highlightedFile: cdnObjectShape,
  isLoading: PropTypes.bool.isRequired,
  onCancelClick: PropTypes.func.isRequired,
  onDeleteFileClick: PropTypes.func.isRequired,
  onDirectoryClick: PropTypes.func.isRequired,
  onFileClick: PropTypes.func.isRequired,
  onFilesDropped: PropTypes.func.isRequired,
  onFilesViewerDisplayChange: PropTypes.func.isRequired,
  onNavigateToParent: PropTypes.func.isRequired,
  onPreviewFileClick: PropTypes.func.isRequired,
  onSearchTermChange: PropTypes.func.isRequired,
  onSelectFileClick: PropTypes.func.isRequired,
  parentDirectory: cdnObjectShape,
  searchTerm: PropTypes.string,
  storageLocation: storageLocationShape.isRequired
};

StorageLocation.defaultProps = {
  currentDirectory: null,
  currentDirectoryPath: null,
  highlightedFile: null,
  parentDirectory: null,
  searchTerm: null
};

export default StorageLocation;
