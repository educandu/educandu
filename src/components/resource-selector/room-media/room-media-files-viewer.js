import PropTypes from 'prop-types';
import classNames from 'classnames';
import React, { useRef } from 'react';
import { Radio, Spin, Tooltip } from 'antd';
import reactDropzoneNs from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import FilterInput from '../../filter-input.js';
import FilesGridViewer from '../shared/files-grid-viewer.js';
import FilesListViewer from '../shared/files-list-viewer.js';
import { cdnObjectShape } from '../../../ui/default-prop-types.js';
import { FILES_VIEWER_DISPLAY } from '../../../domain/constants.js';
import { TableOutlined, UnorderedListOutlined } from '@ant-design/icons';

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
            <div className={getFilesViewerContentClasses()}>
              <FilesViewer
                files={files}
                canDelete={canDelete}
                selectedFileUrl={highlightedFile?.portableUrl || null}
                onFileClick={onFileClick}
                onFileDoubleClick={onFileDoubleClick}
                onDeleteFileClick={onDeleteFileClick}
                onPreviewFileClick={onPreviewFileClick}
                />
            </div>
            {!!isLoading && (
              <div className={classNames('RoomMediaFilesViewer-filesViewerOverlay')}>
                <Spin size="large" />
              </div>
            )}
          </div>
        )}
      </ReactDropzone>
    </div>
  );
}

RoomMediaFilesViewer.propTypes = {
  files: PropTypes.arrayOf(cdnObjectShape).isRequired,
  apiRef: PropTypes.shape({ current: PropTypes.object }),
  isLoading: PropTypes.bool.isRequired,
  canDelete: PropTypes.bool.isRequired,
  filterText: PropTypes.string,
  customFilter: PropTypes.node,
  highlightedFile: cdnObjectShape,
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
