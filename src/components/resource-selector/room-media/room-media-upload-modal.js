import { Modal } from 'antd';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useIsMounted } from '../../../ui/hooks.js';
import FileEditorScreen from '../shared/file-editor-screen.js';
import RoomMediaUploadScreen from './room-media-upload-screen.js';
import { browserFileType } from '../../../ui/default-prop-types.js';

function RoomMediaUploadModal({ isOpen, files, onOk, onCancel }) {
  const isMounted = useIsMounted();
  const [uploadQueue, setUploadQueue] = useState([]);
  const [currentEditedFileIndex, setCurrentEditedFileIndex] = useState(-1);

  useEffect(() => {
    setUploadQueue(files.map(file => ({ file, isPristine: true })));
  }, [files]);

  const handleEditFileClick = fileIndex => {
    setCurrentEditedFileIndex(fileIndex);
  };

  const handleEditBackClick = () => {
    setCurrentEditedFileIndex(-1);
  };

  const handleEditApplyClick = newFile => {
    setUploadQueue(queue => queue.map((item, index) => index !== currentEditedFileIndex ? item : { file: newFile, isPristine: false }));
    setCurrentEditedFileIndex(-1);
  };

  return !!isMounted.current && (
    <Modal
      width="80%"
      forceRender
      title={null}
      open={isOpen}
      footer={null}
      closable={false}
      maskClosable={false}
      onCancel={onCancel}
      >
      <div className="RoomMediaUploadModal">
        {currentEditedFileIndex === -1 && (
          <RoomMediaUploadScreen
            canGoBack={false}
            uploadQueue={uploadQueue}
            canSelectedFilesAfterUpload={false}
            onOkClick={onOk}
            onCancelClick={onCancel}
            onEditFileClick={handleEditFileClick}
            />
        )}
        {currentEditedFileIndex !== -1 && (
          <FileEditorScreen
            file={uploadQueue[currentEditedFileIndex].file}
            onCancelClick={onCancel}
            onBackClick={handleEditBackClick}
            onApplyClick={handleEditApplyClick}
            />
        )}
      </div>
    </Modal>
  );
}

RoomMediaUploadModal.propTypes = {
  files: PropTypes.arrayOf(browserFileType).isRequired,
  isOpen: PropTypes.bool.isRequired,
  onOk: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default RoomMediaUploadModal;
