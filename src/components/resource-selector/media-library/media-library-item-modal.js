import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Form, message, Modal } from 'antd';
import Logger from '../../../common/logger.js';
import { useTranslation } from 'react-i18next';
import ResourceUrl from '../shared/resource-url.js';
import ResourceDetails from '../shared/resource-details.js';
import { handleApiError } from '../../../ui/error-helper.js';
import { useSessionAwareApiClient } from '../../../ui/api-helper.js';
import MediaLibraryMetadataForm from './media-library-metadata-form.js';
import { mediaLibraryItemShape } from '../../../ui/default-prop-types.js';
import MediaLibraryMetadataDisplay from './media-library-metadata-display.js';
import MediaLibraryApiClient from '../../../api-clients/media-library-api-client.js';

const logger = new Logger(import.meta.url);

export const MEDIA_LIBRARY_METADATA_MODAL_MODE = {
  preview: 'preview',
  edit: 'edit'
};

const getDialogTitle = (mode, t) => mode === MEDIA_LIBRARY_METADATA_MODAL_MODE.preview ? t('common:preview') : t('common:edit');

const getDialogOkButtonText = (mode, t) => mode === MEDIA_LIBRARY_METADATA_MODAL_MODE.preview ? t('common:ok') : t('common:save');

function MediaLibaryMetadataModal({
  mode,
  isOpen,
  mediaLibraryItem,
  onSave,
  onClose
}) {
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState();
  const mediaLibraryApiClient = useSessionAwareApiClient(MediaLibraryApiClient);

  const handleOk = () => {
    if (mode === MEDIA_LIBRARY_METADATA_MODAL_MODE.edit) {
      form.submit();
    } else {
      onClose();
    }
  };

  const handleFinish = async ({ description, languages, licenses, tags }) => {
    try {
      setIsSaving(true);
      const editedFile = await mediaLibraryApiClient.updateMediaLibraryItem({
        mediaLibraryItemId: mediaLibraryItem._id,
        description,
        languages,
        licenses,
        tags
      });

      message.success(t('common:changesSavedSuccessfully'));
      onSave(editedFile);
    } catch (error) {
      handleApiError({ error, logger, t });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      width="80%"
      open={isOpen}
      maskClosable={false}
      title={getDialogTitle(mode, t)}
      okButtonProps={{ loading: isSaving }}
      okText={getDialogOkButtonText(mode, t)}
      onOk={handleOk}
      onCancel={onClose}
      >
      <div className="MediaLibaryMetadataModal">
        {!!mediaLibraryItem && (
          <div className="MediaLibaryMetadataModal-displayName">
            {mediaLibraryItem.displayName}
          </div>
        )}
        {!!mediaLibraryItem && mode === MEDIA_LIBRARY_METADATA_MODAL_MODE.preview && (
          <div className="MediaLibaryMetadataModal-splitView">
            <ResourceDetails url={mediaLibraryItem.url} size={mediaLibraryItem.size} previewOnly />
            <MediaLibraryMetadataDisplay mediaLibraryItem={mediaLibraryItem} />
          </div>
        )}
        {!!mediaLibraryItem && mode === MEDIA_LIBRARY_METADATA_MODAL_MODE.edit && (
          <div className="MediaLibaryMetadataModal-splitView">
            <ResourceDetails url={mediaLibraryItem.url} size={mediaLibraryItem.size} previewOnly />
            <MediaLibraryMetadataForm form={form} file={mediaLibraryItem} useOptimizeImage={false} onFinish={handleFinish} />
          </div>
        )}
        {!!mediaLibraryItem && mode === MEDIA_LIBRARY_METADATA_MODAL_MODE.preview && (
          <div className="MediaLibaryMetadataModal-url">
            <ResourceUrl url={mediaLibraryItem.url} />
          </div>
        )}
      </div>
    </Modal>
  );
}

MediaLibaryMetadataModal.propTypes = {
  mode: PropTypes.oneOf(Object.values(MEDIA_LIBRARY_METADATA_MODAL_MODE)).isRequired,
  isOpen: PropTypes.bool.isRequired,
  mediaLibraryItem: mediaLibraryItemShape,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

MediaLibaryMetadataModal.defaultProps = {
  mediaLibraryItem: null
};

export default MediaLibaryMetadataModal;
