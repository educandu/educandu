import PropTypes from 'prop-types';
import classNames from 'classnames';
import React, { useRef } from 'react';
import { Radio, Spin, Tooltip } from 'antd';
import reactDropzoneNs from 'react-dropzone';
import EmptyState from '../../empty-state.js';
import { useTranslation } from 'react-i18next';
import FilterInput from '../../filter-input.js';
import FilterIcon from '../../icons/general/filter-icon.js';
import FilesGridViewer from '../shared/files-grid-viewer.js';
import FilesListViewer from '../shared/files-list-viewer.js';
import { FILES_VIEWER_DISPLAY } from '../../../domain/constants.js';
import { roomMediaItemShape } from '../../../ui/default-prop-types.js';
import { CloudUploadOutlined, TableOutlined, UnorderedListOutlined } from '@ant-design/icons';

const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;
const ReactDropzone = reactDropzoneNs.default || reactDropzoneNs;

function RoomMediaFilesViewer({
  files,
  apiRef,
  isLoading,
  canDelete,
  filterText,
  customFilter,
  highlightedFile,
  filesViewerDisplay,
  onFileClick,
  onFilesDropped,
  onFileDoubleClick,
  onDeleteFileClick,
  onPreviewFileClick,
  onFilterTextChange,
  onFilesViewerDisplayChange
}) {
  const dropzoneRef = useRef(null);
  const { t } = useTranslation('roomMediaFilesViewer');

  if (apiRef) {
    apiRef.current = {
      open() {
        dropzoneRef.current.open();
      }
    };
  }

  const handleFilterTextChange = event => {
    const { value } = event.target;
    onFilterTextChange(value);
  };

  const handleFilesViewerDisplayChange = event => {
    const { value } = event.target;
    onFilesViewerDisplayChange(value);
  };

  const getFilesViewerClasses = isDragActive => classNames({
    'RoomMediaFilesViewer-filesViewer': true,
    'is-dropping': isDragActive && !isLoading,
    'is-drop-rejected': isDragActive && isLoading
  });

  const getFilesViewerContentClasses = () => classNames({
    'RoomMediaFilesViewer-filesViewerContent': true,
    'RoomMediaFilesViewer-filesViewerContent--gridView': filesViewerDisplay === FILES_VIEWER_DISPLAY.grid,
    'RoomMediaFilesViewer-filesViewerContent--listView': filesViewerDisplay === FILES_VIEWER_DISPLAY.list
  });

  const FilesViewer = filesViewerDisplay === FILES_VIEWER_DISPLAY.grid
    ? FilesGridViewer
    : FilesListViewer;

  const showEmptyState = !files.length;

  return (
    <div className="RoomMediaFilesViewer">
      <div className="RoomMediaFilesViewer-buttonsLine">
        <div className="RoomMediaFilesViewer-buttonsLineItem">
          {customFilter || <FilterInput value={filterText} onChange={handleFilterTextChange} />}
        </div>
        <div className="RoomMediaFilesViewer-buttonsLineItem RoomMediaFilesViewer-buttonsLineItem--select">
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
        noClick
        noKeyboard
        ref={dropzoneRef}
        onDrop={!isLoading ? onFilesDropped : null}
        >
        {({ getRootProps, getInputProps, isDragActive }) => (
          <div {...getRootProps({ className: getFilesViewerClasses(isDragActive) })}>
            <input {...getInputProps()} hidden />
            {!!isLoading && (
              <div className="RoomMediaFilesViewer-filesViewerContent">
                <div className="RoomMediaFilesViewer-filesViewerOverlay">
                  <Spin size="large" />
                </div>
              </div>
            )}
            {!isLoading && !!showEmptyState && (
              <div className="RoomMediaFilesViewer-filesViewerContent RoomMediaFilesViewer-filesViewerContent--empty">
                <EmptyState
                  icon={filterText ? <FilterIcon /> : <CloudUploadOutlined />}
                  title={filterText ? t('common:filterResultEmptyStateTitle') : t('emptyStateTitle')}
                  subtitle={filterText ? t('common:searchOrFilterResultEmptyStateSubtitle') : t('emptyStateSubtitle')}
                  />
              </div>
            )}
            {!isLoading && !showEmptyState && (
              <div className={getFilesViewerContentClasses()}>
                <FilesViewer
                  files={files}
                  searchTerm={filterText}
                  selectedFileUrl={highlightedFile?.portableUrl || null}
                  canDelete={canDelete}
                  onFileClick={onFileClick}
                  onFileDoubleClick={onFileDoubleClick}
                  onDeleteFileClick={onDeleteFileClick}
                  onPreviewFileClick={onPreviewFileClick}
                  />
              </div>
            )}
          </div>
        )}
      </ReactDropzone>
    </div>
  );
}

RoomMediaFilesViewer.propTypes = {
  files: PropTypes.arrayOf(roomMediaItemShape).isRequired,
  apiRef: PropTypes.shape({ current: PropTypes.object }),
  isLoading: PropTypes.bool.isRequired,
  canDelete: PropTypes.bool.isRequired,
  filterText: PropTypes.string,
  customFilter: PropTypes.node,
  highlightedFile: roomMediaItemShape,
  filesViewerDisplay: PropTypes.string.isRequired,
  onFileClick: PropTypes.func.isRequired,
  onFilesDropped: PropTypes.func.isRequired,
  onFileDoubleClick: PropTypes.func.isRequired,
  onDeleteFileClick: PropTypes.func.isRequired,
  onPreviewFileClick: PropTypes.func.isRequired,
  onFilterTextChange: PropTypes.func,
  onFilesViewerDisplayChange: PropTypes.func.isRequired
};

RoomMediaFilesViewer.defaultProps = {
  apiRef: null,
  filterText: null,
  customFilter: null,
  highlightedFile: null,
  onFilterTextChange: () => {}
};

export default RoomMediaFilesViewer;
