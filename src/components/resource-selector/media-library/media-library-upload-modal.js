import React from 'react';
import PropTypes from 'prop-types';
import { message, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import { useIsMounted } from '../../../ui/hooks.js';
import MediaLibraryUploadScreen from './media-library-upload-screen.js';

function MediaLibraryUploadModal({
  isOpen,
  onClose,
  onSave
}) {
  const { t } = useTranslation();
  const isMounted = useIsMounted();

  const handleUploadFinished = createdMediaLibraryItems => {
    message.success(t('common:changesSavedSuccessfully'));
    onSave(createdMediaLibraryItems);
  };

  return !!isMounted.current && (
    <Modal
      width="80%"
      forceRender
      open={isOpen}
      title={t('common:create')}
      footer={null}
      closable={false}
      maskClosable={false}
      >
      <div className="MediaLibraryUploadModal">
        {!!isOpen && (
          <MediaLibraryUploadScreen
            canGoBack={false}
            canPreview={false}
            showHeadline={false}
            uploadButtonText={t('common:create')}
            onCancelClick={onClose}
            onUploadFinished={handleUploadFinished}
            />
        )}
      </div>
    </Modal>
  );
}

MediaLibraryUploadModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default MediaLibraryUploadModal;
