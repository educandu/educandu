import PropTypes from 'prop-types';
import Logger from '../../../common/logger.js';
import { useTranslation } from 'react-i18next';
import ImageEditor from '../../image-editor.js';
import ResourceUrl from '../shared/resource-url.js';
import { useIsMounted } from '../../../ui/hooks.js';
import { Button, Form, message, Modal } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import ResourceDetails from '../shared/resource-details.js';
import { handleApiError } from '../../../ui/error-helper.js';
import { useSessionAwareApiClient } from '../../../ui/api-helper.js';
import { confirmExitFileEditor } from '../../confirmation-dialogs.js';
import MediaLibraryFileDropzone from './media-library-file-dropzone.js';
import MediaLibraryMetadataForm from './media-library-metadata-form.js';
import { mediaLibraryItemShape } from '../../../ui/default-prop-types.js';
import { processFileBeforeUpload } from '../../../utils/storage-utils.js';
import MediaLibraryMetadataDisplay from './media-library-metadata-display.js';
import MediaLibraryApiClient from '../../../api-clients/media-library-api-client.js';

const logger = new Logger(import.meta.url);

const createFileInfo = file => file ? { file, isEdited: false } : null;

export const MEDIA_LIBRARY_ITEM_MODAL_MODE = {
  preview: 'preview',
  create: 'create',
  update: 'update'
};

function MediaLibaryItemModal({
  mode,
  isOpen,
  mediaLibraryItem,
  onSave,
  onClose
}) {
  const dropzoneRef = useRef();
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const isMounted = useIsMounted();
  const imageEditorRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [fileInfo, setFileInfo] = useState(createFileInfo(null));
  const [isEditedImageDirty, setIsEditedImageDirty] = useState(false);
  const mediaLibraryApiClient = useSessionAwareApiClient(MediaLibraryApiClient);

  if (mode !== MEDIA_LIBRARY_ITEM_MODAL_MODE.create && !mediaLibraryItem) {
    throw new Error('Cannot preview or update without a media library item');
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (mode !== MEDIA_LIBRARY_ITEM_MODAL_MODE.preview) {
      form.resetFields();
    }

    setIsEditingImage(false);
    setIsEditedImageDirty(false);
    setFileInfo(createFileInfo(null));
  }, [isOpen, mode, form]);

  const handleEditImageClick = () => {
    setIsEditingImage(true);
  };

  const handleImageEditorCrop = ({ isCropped }) => {
    setIsEditedImageDirty(isCropped);
  };

  const handleApplyImageEditorChanges = async () => {
    const newFile = await imageEditorRef.current.getCroppedFile();
    setFileInfo({ ...createFileInfo(newFile), isEdited: true });
    setIsEditingImage(false);
  };

  const handleImageEditorBackClick = () => {
    const leaveEditMode = () => setIsEditingImage(false);
    if (isEditedImageDirty) {
      confirmExitFileEditor(t, leaveEditMode);
    } else {
      leaveEditMode();
    }
  };

  const handleSaveClick = () => {
    form.submit();
  };

  const handleFileDrop = ([newFile]) => {
    if (!isSaving && newFile) {
      setFileInfo(createFileInfo(newFile));
    }
  };

  const handleCreateItemFinish = async ({ description, languages, licenses, tags, optimizeImage }) => {
    try {
      setIsSaving(true);
      const processedFile = await processFileBeforeUpload({ file: fileInfo.file, optimizeImage });
      const createdItem = await mediaLibraryApiClient.createMediaLibraryItem({
        file: processedFile,
        description,
        languages,
        licenses,
        tags
      });

      message.success(t('common:changesSavedSuccessfully'));
      onSave(createdItem);
    } catch (error) {
      handleApiError({ error, logger, t });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateItemFinish = async ({ description, languages, licenses, tags }) => {
    try {
      setIsSaving(true);
      const updatedItem = await mediaLibraryApiClient.updateMediaLibraryItem({
        mediaLibraryItemId: mediaLibraryItem._id,
        description,
        languages,
        licenses,
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

  let dialogTitle;
  let dialogFooter;
  let dialogContent;
  let isDialogClosable;

  switch (mode) {
    case MEDIA_LIBRARY_ITEM_MODAL_MODE.preview:
      isDialogClosable = true;
      dialogTitle = t('common:preview');
      dialogContent = (
        <div className="MediaLibaryItemModal">
          <div className="MediaLibaryItemModal-displayName">
            {mediaLibraryItem.displayName}
          </div>
          <div className="MediaLibaryItemModal-splitView">
            <ResourceDetails url={mediaLibraryItem.url} size={mediaLibraryItem.size} previewOnly />
            <MediaLibraryMetadataDisplay mediaLibraryItem={mediaLibraryItem} />
          </div>
          <div className="MediaLibaryItemModal-url">
            <ResourceUrl url={mediaLibraryItem.url} />
          </div>
        </div>
      );
      dialogFooter = (
        <div className="MediaLibaryItemModal-footer">
          <div className="MediaLibaryItemModal-footerButtons MediaLibaryItemModal-footerButtons--default">
            <Button type="primary" onClick={onClose}>{t('common:ok')}</Button>
          </div>
        </div>
      );
      break;
    case MEDIA_LIBRARY_ITEM_MODAL_MODE.update:
      isDialogClosable = false;
      dialogTitle = t('common:edit');
      dialogContent = (
        <div className="MediaLibaryItemModal">
          <div className="MediaLibaryItemModal-displayName">
            {mediaLibraryItem.displayName}
          </div>
          <div className="MediaLibaryItemModal-splitView">
            <ResourceDetails url={mediaLibraryItem.url} size={mediaLibraryItem.size} previewOnly />
            <MediaLibraryMetadataForm form={form} file={mediaLibraryItem} useOptimizeImage={false} onFinish={handleUpdateItemFinish} />
          </div>
        </div>
      );
      dialogFooter = (
        <div className="MediaLibaryItemModal-footer">
          <div className="MediaLibaryItemModal-footerButtons MediaLibaryItemModal-footerButtons--default">
            <Button onClick={onClose}>{t('common:cancel')}</Button>
            <Button type="primary" loading={isSaving} onClick={handleSaveClick}>{t('common:save')}</Button>
          </div>
        </div>
      );
      break;
    case MEDIA_LIBRARY_ITEM_MODAL_MODE.create:
      isDialogClosable = false;
      dialogTitle = t('common:create');
      if (isEditingImage) {
        dialogContent = (
          <div className="MediaLibaryItemModal">
            <div className="MediaLibaryItemModal-imageEditor">
              <ImageEditor
                file={fileInfo.file}
                editorRef={imageEditorRef}
                onCrop={handleImageEditorCrop}
                />
            </div>
          </div>
        );
        dialogFooter = (
          <div className="MediaLibaryItemModal-footer">
            <div className="MediaLibaryItemModal-footerButtons MediaLibaryItemModal-footerButtons--extra">
              <Button onClick={handleImageEditorBackClick}>{t('common:back')}</Button>
            </div>
            <div className="MediaLibaryItemModal-footerButtons MediaLibaryItemModal-footerButtons--default">
              <Button onClick={onClose}>{t('common:cancel')}</Button>
              <Button type="primary" loading={isSaving} disabled={!isEditedImageDirty} onClick={handleApplyImageEditorChanges}>{t('common:apply')}</Button>
            </div>
          </div>
        );
      } else {
        dialogContent = (
          <div className="MediaLibaryItemModal">
            <div className="MediaLibaryItemModal-splitView">
              <MediaLibraryFileDropzone
                dropzoneRef={dropzoneRef}
                file={fileInfo?.file || null}
                canAcceptFile={!isSaving}
                onFileDrop={handleFileDrop}
                onEditImageClick={handleEditImageClick}
                />
              <MediaLibraryMetadataForm form={form} file={mediaLibraryItem} useOptimizeImage onFinish={handleCreateItemFinish} />
            </div>
          </div>
        );
        dialogFooter = (
          <div className="MediaLibaryItemModal-footer">
            <div className="MediaLibaryItemModal-footerButtons MediaLibaryItemModal-footerButtons--default">
              <Button onClick={onClose}>{t('common:cancel')}</Button>
              <Button type="primary" loading={isSaving} disabled={!fileInfo} onClick={handleSaveClick}>{t('common:save')}</Button>
            </div>
          </div>
        );
      }
      break;
    default:
      throw new Error(`Invalid media library metadata modal mode: '${mode}'`);
  }

  return !!isMounted.current && (
    <Modal
      width="80%"
      forceRender
      open={isOpen}
      title={dialogTitle}
      footer={dialogFooter}
      closable={isDialogClosable}
      maskClosable={isDialogClosable}
      onCancel={onClose}
      >
      {dialogContent}
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
