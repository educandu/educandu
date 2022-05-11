import React from 'react';
import PropTypes from 'prop-types';

function FilesGridViewer({ files }) {
  const renderFile = file => {
    return (
      <div className="FilesGridViewer-file" key={file.path}>{file.name}</div>
    );
  };

  return (
    <div className="FilesGridViewer">
      {files.map(file => renderFile(file))}
    </div>
  );
}

FilesGridViewer.propTypes = {
  files: PropTypes.arrayOf(PropTypes.shape({
    path: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    size: PropTypes.number
  })).isRequired
};

export default FilesGridViewer;
