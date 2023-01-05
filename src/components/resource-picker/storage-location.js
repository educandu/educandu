import PropTypes from 'prop-types';
import classNames from 'classnames';
import FilesViewer from './files-viewer.js';
import UsedStorage from '../used-storage.js';
import reactDropzoneNs from 'react-dropzone';
import DebouncedInput from '../debounced-input.js';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Trans, useTranslation } from 'react-i18next';
import UploadIcon from '../icons/general/upload-icon.js';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Modal, Select, Input } from 'antd';
import { storageLocationShape, cdnObjectShape } from '../../ui/default-prop-types.js';
import { FILES_VIEWER_DISPLAY, STORAGE_LOCATION_TYPE } from '../../domain/constants.js';

const ReactDropzone = reactDropzoneNs.default || reactDropzoneNs;

const { Search } = Input;

const MIN_SEARCH_TERM_LENGTH = 3;

function StorageLocation({
  files,
  isLoading,
  searchTerm,
  highlightedFile,
  storageLocation,
  filesViewerDisplay,
  onSelectHighlightedFileClick,
  onFileClick,
  onFileDoubleClick,
  onCancelClick,
  onDeleteFileClick,
  onPreviewFileClick,
  onSearchTermChange,
  onFilesViewerDisplayChange,
  onFilesDropped
}) {
  const { t } = useTranslation('storageLocation');

  const dropzoneRef = useRef();
  const [typedInSearchTerm, setTypedInSearchTerm] = useState(searchTerm);

  useEffect(() => {
    setTypedInSearchTerm(searchTerm);
  }, [searchTerm]);

  const isInSearchMode = !!searchTerm;
  const canAcceptFiles = !isInSearchMode && !isLoading;

  const handleFileClick = file => {
    onFileClick(file);
  };

  const handleFileDoubleClick = file => {
    onFileDoubleClick(file);
  };

  const handleSelectHighlightedFileClick = () => {
    onSelectHighlightedFileClick(highlightedFile.portableUrl);
  };

  const handleUploadButtonClick = () => {
    dropzoneRef.current.open();
  };

  const handleSearchTermChange = value => {
    setTypedInSearchTerm(value);
  };

  const handleSearchClick = async value => {
    setTypedInSearchTerm(value);

    if (value.length < MIN_SEARCH_TERM_LENGTH) {
      Modal.error({
        title: t('common:error'),
        content: t('common:searchTextTooShort', { minCharCount: MIN_SEARCH_TERM_LENGTH })
      });

      return;
    }

    await onSearchTermChange(value);
  };

  const handleBackToDirectoryScreenClick = async () => {
    await onSearchTermChange('');
  };

  const renderSearchInfo = () => {
    const searchMessage = isLoading
      ? t('common:searchOngoing')
      : (
        <Trans
          t={t}
          i18nKey="common:searchResultInfo"
          values={{ resultCount: files.length, searchTerm }}
          components={[<i key="0" />]}
          />
      );

    return <Alert type="info" message={searchMessage} showIcon />;
  };

  const renderStorageInfo = () => {
    if (storageLocation.type === STORAGE_LOCATION_TYPE.roomMedia && (storageLocation.usedBytes > 0 || storageLocation.maxBytes > 0)) {
      const alertContent = (
        <div className="StorageLocation-alertPrivateStorage">
          <span>{t('privateStorageMessage')}</span>
          <div className="StorageLocation-alertPrivateStorageUsage">
            <UsedStorage usedBytes={storageLocation.usedBytes} maxBytes={storageLocation.maxBytes} showLabel />
          </div>
        </div>
      );
      return <Alert message={alertContent} type="warning" />;
    }

    if (storageLocation.type === STORAGE_LOCATION_TYPE.documentMedia) {
      return <Alert message={t('publicStorageMessage')} type="warning" />;
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
        <div className="StorageLocation-buttonsLineItem">
          <DebouncedInput
            elementType={Search}
            placeholder={t('common:search')}
            value={typedInSearchTerm}
            onSearch={handleSearchClick}
            onChange={handleSearchTermChange}
            />
        </div>
        <div className="StorageLocation-buttonsLineItem StorageLocation-buttonsLineItem--select">
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
            <div className='StorageLocation-filesViewerContent'>
              <FilesViewer
                isLoading={isLoading}
                files={files}
                display={filesViewerDisplay}
                onFileClick={handleFileClick}
                onFileDoubleClick={handleFileDoubleClick}
                selectedFileUrl={highlightedFile?.portableUrl}
                onDeleteFileClick={onDeleteFileClick}
                onPreviewFileClick={onPreviewFileClick}
                canDelete={storageLocation.isDeletionEnabled}
                />
            </div>
          </div>
        )}
      </ReactDropzone>
      <div className="StorageLocation-locationInfo">
        {isInSearchMode ? renderSearchInfo() : renderStorageInfo()}
      </div>
      <div className="u-resource-picker-screen-footer">
        {!isInSearchMode && (
          <Button onClick={handleUploadButtonClick} icon={<UploadIcon />} disabled={!canAcceptFiles}>{t('uploadFiles')}</Button>
        )}
        {!!isInSearchMode && (
          <Button onClick={handleBackToDirectoryScreenClick} icon={<ArrowLeftOutlined />} disabled={isLoading}>{t('backToDirectoryView')}</Button>
        )}
        <div className="u-resource-picker-screen-footer-buttons">
          <Button onClick={onCancelClick}>{t('common:cancel')}</Button>
          <Button type="primary" onClick={handleSelectHighlightedFileClick} disabled={!highlightedFile || isLoading}>{t('common:select')}</Button>
        </div>
      </div>
    </div>
  );
}

StorageLocation.propTypes = {
  files: PropTypes.arrayOf(cdnObjectShape).isRequired,
  filesViewerDisplay: PropTypes.string.isRequired,
  highlightedFile: cdnObjectShape,
  isLoading: PropTypes.bool.isRequired,
  onCancelClick: PropTypes.func.isRequired,
  onDeleteFileClick: PropTypes.func.isRequired,
  onFileClick: PropTypes.func.isRequired,
  onFileDoubleClick: PropTypes.func.isRequired,
  onFilesDropped: PropTypes.func.isRequired,
  onFilesViewerDisplayChange: PropTypes.func.isRequired,
  onPreviewFileClick: PropTypes.func.isRequired,
  onSearchTermChange: PropTypes.func.isRequired,
  onSelectHighlightedFileClick: PropTypes.func.isRequired,
  searchTerm: PropTypes.string,
  storageLocation: storageLocationShape.isRequired
};

StorageLocation.defaultProps = {
  highlightedFile: null,
  searchTerm: null
};

export default StorageLocation;
