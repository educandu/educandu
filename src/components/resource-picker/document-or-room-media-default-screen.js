import PropTypes from 'prop-types';
import classNames from 'classnames';
import React, { useRef } from 'react';
import UsedStorage from '../used-storage.js';
import reactDropzoneNs from 'react-dropzone';
import FilterInput from '../filter-input.js';
import { useTranslation } from 'react-i18next';
import FilesGridViewer from './files-grid-viewer.js';
import FilesListViewer from './files-list-viewer.js';
import UploadIcon from '../icons/general/upload-icon.js';
import { Alert, Button, Radio, Spin, Tooltip } from 'antd';
import { TableOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { storageLocationShape, cdnObjectShape } from '../../ui/default-prop-types.js';
import { FILES_VIEWER_DISPLAY, STORAGE_LOCATION_TYPE } from '../../domain/constants.js';

const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;
const ReactDropzone = reactDropzoneNs.default || reactDropzoneNs;

function DocumentOrRoomMediaDefaultScreen({
  files,
  isLoading,
  filterText,
  highlightedFile,
  storageLocation,
  filesViewerDisplay,
  onSelectHighlightedFileClick,
  onFileClick,
  onFileDoubleClick,
  onCancelClick,
  onDeleteFileClick,
  onPreviewFileClick,
  onFilterTextChange,
  onFilesViewerDisplayChange,
  onFilesDropped
}) {
  const { t } = useTranslation('documentOrRoomMediaDefaultScreen');

  const dropzoneRef = useRef();

  const canAcceptFiles = !isLoading;

  const handleSelectHighlightedFileClick = () => {
    onSelectHighlightedFileClick(highlightedFile.portableUrl);
  };

  const handleUploadButtonClick = () => {
    dropzoneRef.current.open();
  };

  const handleFilterTextChange = event => {
    const { value } = event.target;
    onFilterTextChange(value);
  };

  const handleFilesViewerDisplayChange = event => {
    const { value } = event.target;
    onFilesViewerDisplayChange(value);
  };

  const renderStorageInfo = () => {
    if (storageLocation.type === STORAGE_LOCATION_TYPE.roomMedia && (storageLocation.usedBytes > 0 || storageLocation.maxBytes > 0)) {
      const alertContent = (
        <div className="DocumentOrRoomMediaDefaultScreen-alertPrivateStorage">
          <span>{t('privateStorageMessage')}.</span>
          <div className="DocumentOrRoomMediaDefaultScreen-alertPrivateStorageUsage">
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
    'DocumentOrRoomMediaDefaultScreen-filesViewer': true,
    'u-can-drop': isDragActive && !isLoading,
    'u-cannot-drop': isDragActive && !!isLoading
  });

  const FilesViewer = filesViewerDisplay === FILES_VIEWER_DISPLAY.grid
    ? FilesGridViewer
    : FilesListViewer;

  return (
    <div className="DocumentOrRoomMediaDefaultScreen">
      <div className="DocumentOrRoomMediaDefaultScreen-buttonsLine">
        <div className="DocumentOrRoomMediaDefaultScreen-buttonsLineItem">
          <FilterInput value={filterText} onChange={handleFilterTextChange} />
        </div>
        <div className="DocumentOrRoomMediaDefaultScreen-buttonsLineItem DocumentOrRoomMediaDefaultScreen-buttonsLineItem--select">
          <RadioGroup value={filesViewerDisplay} onChange={handleFilesViewerDisplayChange}>
            <Tooltip title={t('filesView_list')}>
              <RadioButton value={FILES_VIEWER_DISPLAY.list}>
                <UnorderedListOutlined />
              </RadioButton>
            </Tooltip>
            <Tooltip title={t('filesView_grid')}>
              <RadioButton value={FILES_VIEWER_DISPLAY.grid}>
                <TableOutlined />
              </RadioButton>
            </Tooltip>
          </RadioGroup>
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
            <div className="DocumentOrRoomMediaDefaultScreen-filesViewerContent">
              <FilesViewer
                files={files}
                selectedFileUrl={highlightedFile?.portableUrl || null}
                canDelete={storageLocation.isDeletionEnabled}
                onFileClick={onFileClick}
                onFileDoubleClick={onFileDoubleClick}
                onDeleteFileClick={onDeleteFileClick}
                onPreviewFileClick={onPreviewFileClick}
                />
            </div>
            {!!isLoading && (
              <div className={classNames('DocumentOrRoomMediaDefaultScreen-filesViewerOverlay')}>
                <Spin size="large" />
              </div>
            )}
          </div>
        )}
      </ReactDropzone>
      <div className="DocumentOrRoomMediaDefaultScreen-locationInfo">
        {renderStorageInfo()}
      </div>
      <div className="u-resource-picker-screen-footer">
        <Button onClick={handleUploadButtonClick} icon={<UploadIcon />} disabled={!canAcceptFiles}>
          {t('uploadFiles')}
        </Button>
        <div className="u-resource-picker-screen-footer-buttons">
          <Button onClick={onCancelClick}>
            {t('common:cancel')}
          </Button>
          <Button type="primary" onClick={handleSelectHighlightedFileClick} disabled={!highlightedFile || isLoading}>
            {t('common:select')}
          </Button>
        </div>
      </div>
    </div>
  );
}

DocumentOrRoomMediaDefaultScreen.propTypes = {
  files: PropTypes.arrayOf(cdnObjectShape).isRequired,
  filesViewerDisplay: PropTypes.string.isRequired,
  highlightedFile: cdnObjectShape,
  isLoading: PropTypes.bool.isRequired,
  filterText: PropTypes.string,
  storageLocation: storageLocationShape.isRequired,
  onCancelClick: PropTypes.func.isRequired,
  onDeleteFileClick: PropTypes.func.isRequired,
  onFileClick: PropTypes.func.isRequired,
  onFileDoubleClick: PropTypes.func.isRequired,
  onFilesDropped: PropTypes.func.isRequired,
  onFilesViewerDisplayChange: PropTypes.func.isRequired,
  onPreviewFileClick: PropTypes.func.isRequired,
  onFilterTextChange: PropTypes.func.isRequired,
  onSelectHighlightedFileClick: PropTypes.func.isRequired
};

DocumentOrRoomMediaDefaultScreen.defaultProps = {
  highlightedFile: null,
  filterText: null
};

export default DocumentOrRoomMediaDefaultScreen;
