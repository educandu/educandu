import React from 'react';
import { Spin } from 'antd';
import PropTypes from 'prop-types';
import FilesGridViewer from './files-grid-viewer.js';
import FilesListViewer from './files-list-viewer.js';
import { cdnObjectShape } from '../ui/default-prop-types.js';

export const FILES_VIEWER_DISPLAY = {
  grid: 'grid',
  list: 'list'
};

function FilesViewer({
  display,
  files,
  parentDirectory,
  selectedFileUrl,
  canDelete,
  canNavigateToParent,
  onDeleteClick,
  onFileClick,
  onPreviewClick,
  onNavigateToParentClick,
  isLoading
}) {
  const ViewerComponent = display === FILES_VIEWER_DISPLAY.grid
    ? FilesGridViewer
    : FilesListViewer;

  return (
    <div className="FilesViewer">
      <ViewerComponent
        files={files}
        parentDirectory={parentDirectory}
        selectedFileUrl={selectedFileUrl || null}
        canDelete={canDelete}
        canNavigateToParent={canNavigateToParent}
        onDeleteClick={onDeleteClick}
        onFileClick={onFileClick}
        onPreviewClick={onPreviewClick}
        onNavigateToParentClick={onNavigateToParentClick}
        />
      {isLoading && (
        <div className="FilesViewer-loadingOverlay">
          <Spin size="large" />
        </div>
      )}
    </div>
  );
}

FilesViewer.propTypes = {
  canDelete: PropTypes.bool,
  canNavigateToParent: PropTypes.bool,
  display: PropTypes.oneOf(Object.values(FILES_VIEWER_DISPLAY)),
  files: PropTypes.arrayOf(cdnObjectShape),
  isLoading: PropTypes.bool,
  onDeleteClick: PropTypes.func,
  onFileClick: PropTypes.func,
  onNavigateToParentClick: PropTypes.func,
  onPreviewClick: PropTypes.func,
  parentDirectory: cdnObjectShape,
  selectedFileUrl: PropTypes.string
};

FilesViewer.defaultProps = {
  canDelete: false,
  canNavigateToParent: false,
  display: FILES_VIEWER_DISPLAY.grid,
  files: [],
  isLoading: false,
  onDeleteClick: () => {},
  onFileClick: () => {},
  onNavigateToParentClick: () => {},
  onPreviewClick: () => {},
  parentDirectory: null,
  selectedFileUrl: null
};

export default FilesViewer;
