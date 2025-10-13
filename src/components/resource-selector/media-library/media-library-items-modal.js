import PropTypes from 'prop-types';
import Logger from '../../../common/logger.js';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import ResourceUrl from '../shared/resource-url.js';
import { Button, Form, message, Modal } from 'antd';
import { useIsMounted } from '../../../ui/hooks.js';
import { handleApiError } from '../../../ui/error-helper.js';
import { useSessionAwareApiClient } from '../../../ui/api-helper.js';
import MediaLibraryUploadScreen from './media-library-upload-screen.js';
import MediaLibraryMetadataForm from './media-library-metadata-form.js';
import MediaLibraryMetadataDisplay from './media-library-metadata-display.js';
import MediaLibraryApiClient from '../../../api-clients/media-library-api-client.js';
import ResourcePreviewWithMetadata from '../shared/resource-preview-with-metadata.js';
import { mediaLibraryItemShape, mediaTrashItemShape } from '../../../ui/default-prop-types.js';

const logger = new Logger(import.meta.url);

export const MEDIA_LIBRARY_ITEMS_MODAL_MODE = {
  none: 'none',
  create: 'create',
  update: 'update',
  preview: 'preview',
  trashPreview: 'trashPreview',
};

const modesRequiringMediaLibraryItem = [
  MEDIA_LIBRARY_ITEMS_MODAL_MODE.preview,
  MEDIA_LIBRARY_ITEMS_MODAL_MODE.update
];

function MediaLibaryItemsModal({
  mode,
  isOpen,
  mediaTrashItem,
  mediaLibraryItem,
  onCreated,
  onUpdated,
  onClose
}) {
  const { t } = useTranslation();
  const isMounted = useIsMounted();
  const [updateForm] = Form.useForm();
  const [isVisible, setIsVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isFinishedUploading, setIsFinishedUploading] = useState(false);
  const mediaLibraryApiClient = useSessionAwareApiClient(MediaLibraryApiClient);

  if (!!isVisible && modesRequiringMediaLibraryItem.includes(mode) && !mediaLibraryItem) {
    throw new Error(`mediaLibraryItem needs to be provided in '${mode}' mode!`);
  }

  useEffect(() => {
    if (!isOpen) {
      setIsUpdating(false);
      setIsFinishedUploading(false);
      return;
    }

    setIsVisible(true);
  }, [t, isOpen, mode, updateForm]);

  useEffect(() => {
    if (isOpen && isVisible && mode === MEDIA_LIBRARY_ITEMS_MODAL_MODE.update) {
      updateForm.resetFields();
    }
  }, [isOpen, isVisible, mode, updateForm]);

  const handleUpdateSaveClick = () => {
    updateForm.submit();
  };

  const handleFormUpdateFinish = async ({ shortDescription, languages, licenses, allRightsReserved, tags }) => {
    try {
      setIsUpdating(true);
      const updatedMediaLibraryItem = await mediaLibraryApiClient.updateMediaLibraryItem({
        mediaLibraryItemId: mediaLibraryItem._id,
        shortDescription,
        languages,
        licenses,
        allRightsReserved,
        tags
      });

      message.success(t('common:changesSavedSuccessfully'));
      onUpdated(updatedMediaLibraryItem);
    } catch (error) {
      handleApiError({ error, logger, t });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelUploadClick = () => {
    onClose();
  };

  const handleUploadFinish = createdMediaLibraryItems => {
    message.success(t('common:changesSavedSuccessfully'));
    setIsFinishedUploading(true);
    onCreated(createdMediaLibraryItems);
  };

  const handleAfterOpenChange = open => {
    if (!open) {
      setIsVisible(false);
    }
  };

  const getDialogTitle = () => {
    if (isVisible && mode === MEDIA_LIBRARY_ITEMS_MODAL_MODE.create) {
      return isFinishedUploading ? t('common:createdMediaCenterItems') : t('common:create');
    }
    if (isVisible && mode === MEDIA_LIBRARY_ITEMS_MODAL_MODE.preview) {
      return t('common:preview');
    }
    if (isVisible && mode === MEDIA_LIBRARY_ITEMS_MODAL_MODE.update) {
      return t('common:edit');
    }
    return null;
  };

  const getDialogContent = () => {
    if (isVisible && mode === MEDIA_LIBRARY_ITEMS_MODAL_MODE.create) {
      return (
        <div className="MediaLibaryItemsModal MediaLibaryItemsModal--createMode">
          <MediaLibraryUploadScreen
            canCancel={!isFinishedUploading}
            canGoBack={false}
            canSelect={false}
            showHeadline={false}
            uploadButtonText={t('common:create')}
            onCancelClick={handleCancelUploadClick}
            onUploadFinish={handleUploadFinish}
            />
        </div>
      );
    }

    if (isVisible && mode === MEDIA_LIBRARY_ITEMS_MODAL_MODE.preview) {
      return (
        <div className="MediaLibaryItemsModal">
          <div className="MediaLibaryItemsModal-name">
            {mediaLibraryItem.name}
          </div>
          <div className="MediaLibaryItemsModal-splitView">
            <ResourcePreviewWithMetadata urlOrFile={mediaLibraryItem.url} size={mediaLibraryItem.size} />
            <MediaLibraryMetadataDisplay mediaLibraryItem={mediaLibraryItem} />
          </div>
          <div className="MediaLibaryItemsModal-url">
            <ResourceUrl url={mediaLibraryItem.url} />
          </div>
        </div>
      );
    }

    if (isVisible && mode === MEDIA_LIBRARY_ITEMS_MODAL_MODE.trashPreview) {
      return (
        <div className="MediaLibaryItemsModal">
          <div className="MediaLibaryItemsModal-name">
            {mediaLibraryItem.name}
          </div>
          <div className="MediaLibaryItemsModal-splitView">
            <ResourcePreviewWithMetadata urlOrFile={mediaTrashItem.url} size={mediaTrashItem.size} />
            <MediaLibraryMetadataDisplay mediaLibraryItem={mediaLibraryItem} />
          </div>
          <div className="MediaLibaryItemsModal-url">
            <ResourceUrl url={mediaTrashItem.url} />
          </div>
        </div>
      );
    }

    if (isVisible && mode === MEDIA_LIBRARY_ITEMS_MODAL_MODE.update) {
      return (
        <div className="MediaLibaryItemsModal">
          <div className="MediaLibaryItemsModal-name">
            {mediaLibraryItem.name}
          </div>
          <div className="MediaLibaryItemsModal-splitView">
            <ResourcePreviewWithMetadata urlOrFile={mediaLibraryItem.url} size={mediaLibraryItem.size} />
            <MediaLibraryMetadataForm form={updateForm} file={mediaLibraryItem} useOptimizeImage={false} onFinish={handleFormUpdateFinish} />
          </div>
        </div>
      );
    }

    return null;
  };

  const getDialogFooter = () => {
    if (isVisible && mode === MEDIA_LIBRARY_ITEMS_MODAL_MODE.create && isFinishedUploading) {
      return (
        <div className="MediaLibaryItemsModal-footer">
          <Button type="primary" onClick={onClose}>{t('common:ok')}</Button>
        </div>
      );
    }
    if (isVisible && (mode === MEDIA_LIBRARY_ITEMS_MODAL_MODE.preview || mode === MEDIA_LIBRARY_ITEMS_MODAL_MODE.trashPreview)) {
      return (
        <div className="MediaLibaryItemsModal-footer">
          <Button type="primary" onClick={onClose}>{t('common:ok')}</Button>
        </div>
      );
    }
    if (isVisible && mode === MEDIA_LIBRARY_ITEMS_MODAL_MODE.update) {
      return (
        <div className="MediaLibaryItemsModal-footer">
          <Button onClick={onClose}>{t('common:cancel')}</Button>
          <Button type="primary" loading={isUpdating} onClick={handleUpdateSaveClick}>{t('common:save')}</Button>
        </div>
      );
    }
    return null;
  };

  const isDialogClosable = isVisible && (mode === MEDIA_LIBRARY_ITEMS_MODAL_MODE.preview || mode === MEDIA_LIBRARY_ITEMS_MODAL_MODE.trashPreview);

  return !!isMounted.current && (
    <Modal
      width="80%"
      centered
      forceRender
      open={isOpen}
      className='u-modal'
      title={getDialogTitle()}
      footer={getDialogFooter()}
      closable={isDialogClosable}
      maskClosable={isDialogClosable}
      onCancel={onClose}
      afterOpenChange={handleAfterOpenChange}
      >
      {getDialogContent()}
    </Modal>
  );
}

MediaLibaryItemsModal.propTypes = {
  mode: PropTypes.oneOf(Object.values(MEDIA_LIBRARY_ITEMS_MODAL_MODE)).isRequired,
  isOpen: PropTypes.bool.isRequired,
  mediaTrashItem: mediaTrashItemShape,
  mediaLibraryItem: mediaLibraryItemShape,
  onClose: PropTypes.func.isRequired,
  onCreated: PropTypes.func,
  onUpdated: PropTypes.func,
};

MediaLibaryItemsModal.defaultProps = {
  mediaTrashItem: null,
  mediaLibraryItem: null,
  onCreated: () => {},
  onUpdated: () => {}
};

export default MediaLibaryItemsModal;
