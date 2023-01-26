import React from 'react';
import PropTypes from 'prop-types';
import FilesGridViewer from './files-grid-viewer.js';
import FilesListViewer from './files-list-viewer.js';
import { cdnObjectShape } from '../../ui/default-prop-types.js';
import { FILES_VIEWER_DISPLAY } from '../../domain/constants.js';

function FilesViewer({
  display,
  files,
  selectedFileUrl,
  canDelete,
  onFileClick,
  onFileDoubleClick,
  onDeleteFileClick,
  onPreviewFileClick
}) {
  const ViewerComponent = display === FILES_VIEWER_DISPLAY.grid
    ? FilesGridViewer
    : FilesListViewer;

  return (
    <div className="FilesViewer">
      <ViewerComponent
        files={files}
        selectedFileUrl={selectedFileUrl || null}
        canDelete={canDelete}
        onFileClick={onFileClick}
        onFileDoubleClick={onFileDoubleClick}
        onDeleteFileClick={onDeleteFileClick}
        onPreviewFileClick={onPreviewFileClick}
        />
    </div>
  );
}

FilesViewer.propTypes = {
  canDelete: PropTypes.bool,
  display: PropTypes.oneOf(Object.values(FILES_VIEWER_DISPLAY)),
  files: PropTypes.arrayOf(cdnObjectShape),
  onDeleteFileClick: PropTypes.func,
  onFileClick: PropTypes.func,
  onFileDoubleClick: PropTypes.func,
  onPreviewFileClick: PropTypes.func,
  selectedFileUrl: PropTypes.string
};

FilesViewer.defaultProps = {
  canDelete: false,
  display: FILES_VIEWER_DISPLAY.grid,
  files: [],
  onDeleteFileClick: () => {},
  onFileClick: () => {},
  onFileDoubleClick: () => {},
  onPreviewFileClick: () => {},
  selectedFileUrl: null
};

export default FilesViewer;
