import React from 'react';
import PropTypes from 'prop-types';
import { Button } from 'antd';
import { EnterOutlined } from '@ant-design/icons';

function FilesGridViewer({ files, canNavigateToParent, onNavigateToParent, onFileClick }) {
  const renderFile = file => {
    return (
      <a className="FilesGridViewer-fileContainer" key={file.path} onClick={() => onFileClick(file)}>
        <div className="FilesGridViewer-file" />
        <span>{file.name}</span>
      </a>
    );
  };

  return (
    <div className="FilesGridViewer">
      {canNavigateToParent && (
        <Button
          type="link"
          className="FilesGridViewer-navigateToParentButton"
          onClick={onNavigateToParent}
          icon={<EnterOutlined className="FilesGridViewer-navigateToParentIcon" />}
          >
          ...
        </Button>
      )}
      {files.map(file => renderFile(file))}
    </div>
  );
}

FilesGridViewer.propTypes = {
  canNavigateToParent: PropTypes.bool,
  files: PropTypes.arrayOf(PropTypes.shape({
    path: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    size: PropTypes.number
  })).isRequired,
  onFileClick: PropTypes.func,
  onNavigateToParent: PropTypes.func
};

FilesGridViewer.defaultProps = {
  canNavigateToParent: false,
  onFileClick: () => {},
  onNavigateToParent: () => {}
};

export default FilesGridViewer;
