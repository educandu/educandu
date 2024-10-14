import PropTypes from 'prop-types';
import Logger from '../../../common/logger.js';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import ResourceUrl from '../shared/resource-url.js';
import { Button, Form, message, Modal } from 'antd';
import { useIsMounted } from '../../../ui/hooks.js';
import { handleApiError } from '../../../ui/error-helper.js';
import { useSessionAwareApiClient } from '../../../ui/api-helper.js';
import MediaLibraryMetadataForm from './media-library-metadata-form.js';
import { mediaLibraryItemShape } from '../../../ui/default-prop-types.js';
import MediaLibraryMetadataDisplay from './media-library-metadata-display.js';
import MediaLibraryApiClient from '../../../api-clients/media-library-api-client.js';
import ResourcePreviewWithMetadata from '../shared/resource-preview-with-metadata.js';

const logger = new Logger(import.meta.url);

export const MEDIA_LIBRARY_ITEM_MODAL_MODE = {
  preview: 'preview',
  update: 'update'
};

function MediaLibaryItemModal({
  mode,
  isOpen,
  mediaLibraryItem,
  onSave,
  onClose
}) {
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const isMounted = useIsMounted();
  const [isSaving, setIsSaving] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const mediaLibraryApiClient = useSessionAwareApiClient(MediaLibraryApiClient);

  if (!!isVisible && !mediaLibraryItem) {
    throw new Error('Cannot preview or update without a media library item');
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setIsVisible(true);
  }, [t, isOpen, mode, form]);

  useEffect(() => {
    if (isOpen && isVisible && mode === MEDIA_LIBRARY_ITEM_MODAL_MODE.update) {
      form.resetFields();
    }
  }, [isOpen, isVisible, mode, form]);

  const handleSaveClick = () => {
    form.submit();
  };

  const handleUpdateItemFinish = async ({ shortDescription, languages, licenses, allRightsReserved, tags }) => {
    try {
      setIsSaving(true);
      const updatedItem = await mediaLibraryApiClient.updateMediaLibraryItem({
        mediaLibraryItemId: mediaLibraryItem._id,
        shortDescription,
        languages,
        licenses,
        allRightsReserved,
        tags
      });

      message.success(t('common:changesSavedSuccessfully'));
      onSave(updatedItem);
    } catch (error) {
      handleApiError({ error, logger, t });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAfterOpenChange = open => {
    if (!open) {
      setIsVisible(false);
    }
  };

  const getDialogTitle = () => {
    if (isVisible && mode === MEDIA_LIBRARY_ITEM_MODAL_MODE.preview) {
      return t('common:preview');
    }
    if (isVisible && mode === MEDIA_LIBRARY_ITEM_MODAL_MODE.update) {
      return t('common:edit');
    }
    return null;
  };

  const getDialogContent = () => {
    if (isVisible && mode === MEDIA_LIBRARY_ITEM_MODAL_MODE.preview) {
      return (
        <div className="MediaLibaryItemModal">
          <div className="MediaLibaryItemModal-name">
            {mediaLibraryItem.name}
          </div>
          <div className="MediaLibaryItemModal-splitView">
            <ResourcePreviewWithMetadata urlOrFile={mediaLibraryItem.url} size={mediaLibraryItem.size} />
            <MediaLibraryMetadataDisplay mediaLibraryItem={mediaLibraryItem} />
          </div>
          <div className="MediaLibaryItemModal-url">
            <ResourceUrl url={mediaLibraryItem.url} />
          </div>
        </div>
      );
    }

    if (isVisible && mode === MEDIA_LIBRARY_ITEM_MODAL_MODE.update) {
      return (
        <div className="MediaLibaryItemModal">
          <div className="MediaLibaryItemModal-name">
            {mediaLibraryItem.name}
          </div>
          <div className="MediaLibaryItemModal-splitView">
            <ResourcePreviewWithMetadata urlOrFile={mediaLibraryItem.url} size={mediaLibraryItem.size} />
            <MediaLibraryMetadataForm form={form} file={mediaLibraryItem} useOptimizeImage={false} onFinish={handleUpdateItemFinish} />
          </div>
        </div>
      );
    }

    return null;
  };

  const getDialogFooter = () => {
    if (isVisible && mode === MEDIA_LIBRARY_ITEM_MODAL_MODE.preview) {
      return (
        <div className="MediaLibaryItemModal-footer">
          <Button type="primary" onClick={onClose}>{t('common:ok')}</Button>
        </div>
      );
    }
    if (isVisible && mode === MEDIA_LIBRARY_ITEM_MODAL_MODE.update) {
      return (
        <div className="MediaLibaryItemModal-footer">
          <Button onClick={onClose}>{t('common:cancel')}</Button>
          <Button type="primary" loading={isSaving} onClick={handleSaveClick}>{t('common:save')}</Button>
        </div>
      );
    }
    return null;
  };

  const isDialogClosable = isVisible && mode === MEDIA_LIBRARY_ITEM_MODAL_MODE.preview;

  return !!isMounted.current && (
    <Modal
      width="80%"
      forceRender
      open={isOpen}
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

MediaLibaryItemModal.propTypes = {
  mode: PropTypes.oneOf(Object.values(MEDIA_LIBRARY_ITEM_MODAL_MODE)).isRequired,
  isOpen: PropTypes.bool.isRequired,
  mediaLibraryItem: mediaLibraryItemShape,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func
};

MediaLibaryItemModal.defaultProps = {
  mediaLibraryItem: null,
  onSave: () => {}
};

export default MediaLibaryItemModal;
