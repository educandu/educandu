import { Button } from 'antd';
import PropTypes from 'prop-types';
import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import UsedStorage from '../../used-storage.js';
import UploadIcon from '../../icons/general/upload-icon.js';
import RoomMediaFilesViewer from './room-media-files-viewer.js';
import { useRoomMediaContext } from '../../room-media-context.js';
import { cdnObjectShape } from '../../../ui/default-prop-types.js';

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
  const filesViewerApiRef = useRef();
  const roomMediaContext = useRoomMediaContext();
  const { t } = useTranslation('roomMediaDefaultScreen');

  const handleSelectHighlightedFileClick = () => {
    onSelectHighlightedFileClick(highlightedFile.portableUrl);
  };

  const handleUploadButtonClick = () => {
    filesViewerApiRef.current.open();
  };

  const renderStorageInfo = () => {
    return roomMediaContext
      ? (
        <div className="RoomMediaDefaultScreen-alertPrivateStorage">
          <div className="RoomMediaDefaultScreen-alertPrivateStorageUsage">
            <UsedStorage usedBytes={roomMediaContext.usedBytes} maxBytes={roomMediaContext.maxBytes} showLabel />
          </div>
        </div>
      )
      : null;
  };

  return (
    <div className="RoomMediaDefaultScreen">
      <RoomMediaFilesViewer
        files={files}
        isLoading={isLoading}
        filterText={filterText}
        apiRef={filesViewerApiRef}
        highlightedFile={highlightedFile}
        canDelete={roomMediaContext?.isDeletionEnabled || false}
        filesViewerDisplay={filesViewerDisplay}
        onFileClick={onFileClick}
        onFilesDropped={onFilesDropped}
        onFileDoubleClick={onFileDoubleClick}
        onDeleteFileClick={onDeleteFileClick}
        onPreviewFileClick={onPreviewFileClick}
        onFilterTextChange={onFilterTextChange}
        onFilesViewerDisplayChange={onFilesViewerDisplayChange}
        />
      <div className="RoomMediaDefaultScreen-storageInfo">
        {renderStorageInfo()}
      </div>
      <div className="u-resource-selector-screen-footer">
        <Button onClick={handleUploadButtonClick} icon={<UploadIcon />} disabled={isLoading}>
          {t('common:uploadFiles')}
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
