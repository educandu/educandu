import PropTypes from 'prop-types';
import classNames from 'classnames';
import React, { useRef } from 'react';
import reactDropzoneNs from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import FilterInput from '../../filter-input.js';
import UsedStorage from '../../used-storage.js';
import { Button, Radio, Spin, Tooltip } from 'antd';
import { useStorage } from '../../storage-context.js';
import UploadIcon from '../../icons/general/upload-icon.js';
import FilesGridViewer from '../shared/files-grid-viewer.js';
import FilesListViewer from '../shared/files-list-viewer.js';
import { cdnObjectShape } from '../../../ui/default-prop-types.js';
import { FILES_VIEWER_DISPLAY } from '../../../domain/constants.js';
import { TableOutlined, UnorderedListOutlined } from '@ant-design/icons';

const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;
const ReactDropzone = reactDropzoneNs.default || reactDropzoneNs;

function RoomMediaDefaultScreen({
  files,
  isLoading,
  filterText,
  highlightedFile,
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
  const { t } = useTranslation('roomMediaDefaultScreen');

  const dropzoneRef = useRef();
  const storage = useStorage();

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
    if (!storage.usedBytes > 0 && !storage.maxBytes) {
      return null;
    }
    return (
      <div className="RoomMediaDefaultScreen-alertPrivateStorage">
        <div className="RoomMediaDefaultScreen-alertPrivateStorageUsage">
          <UsedStorage usedBytes={storage.usedBytes} maxBytes={storage.maxBytes} showLabel />
        </div>
      </div>
    );
  };

  const getFilesViewerClasses = isDragActive => classNames({
    'RoomMediaDefaultScreen-filesViewer': true,
    'is-dropping': isDragActive && !isLoading,
    'is-drop-rejected': isDragActive && isLoading
  });

  const FilesViewer = filesViewerDisplay === FILES_VIEWER_DISPLAY.grid
    ? FilesGridViewer
    : FilesListViewer;

  return (
    <div className="RoomMediaDefaultScreen">
      <div className="RoomMediaDefaultScreen-buttonsLine">
        <div className="RoomMediaDefaultScreen-buttonsLineItem">
          <FilterInput value={filterText} onChange={handleFilterTextChange} />
        </div>
        <div className="RoomMediaDefaultScreen-buttonsLineItem RoomMediaDefaultScreen-buttonsLineItem--select">
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
            <div className="RoomMediaDefaultScreen-filesViewerContent">
              <FilesViewer
                files={files}
                selectedFileUrl={highlightedFile?.portableUrl || null}
                canDelete={storage.isDeletionEnabled}
                onFileClick={onFileClick}
                onFileDoubleClick={onFileDoubleClick}
                onDeleteFileClick={onDeleteFileClick}
                onPreviewFileClick={onPreviewFileClick}
                />
            </div>
            {!!isLoading && (
              <div className={classNames('RoomMediaDefaultScreen-filesViewerOverlay')}>
                <Spin size="large" />
              </div>
            )}
          </div>
        )}
      </ReactDropzone>
      <div className="RoomMediaDefaultScreen-locationInfo">
        {renderStorageInfo()}
      </div>
      <div className="u-resource-selector-screen-footer">
        <Button onClick={handleUploadButtonClick} icon={<UploadIcon />} disabled={!canAcceptFiles}>
          {t('uploadFiles')}
        </Button>
        <div className="u-resource-selector-screen-footer-buttons">
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

RoomMediaDefaultScreen.propTypes = {
  files: PropTypes.arrayOf(cdnObjectShape).isRequired,
  filesViewerDisplay: PropTypes.string.isRequired,
  highlightedFile: cdnObjectShape,
  isLoading: PropTypes.bool.isRequired,
  filterText: PropTypes.string,
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

RoomMediaDefaultScreen.defaultProps = {
  highlightedFile: null,
  filterText: null
};

export default RoomMediaDefaultScreen;
