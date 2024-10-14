import PropTypes from 'prop-types';
import prettyBytes from 'pretty-bytes';
import Logger from '../../../common/logger.js';
import { useTranslation } from 'react-i18next';
import ImageEditor from '../../image-editor.js';
import ResourceUrl from '../shared/resource-url.js';
import { Button, Form, message, Modal } from 'antd';
import permissions from '../../../domain/permissions.js';
import React, { useEffect, useRef, useState } from 'react';
import { handleApiError } from '../../../ui/error-helper.js';
import { useIsMounted, usePermission } from '../../../ui/hooks.js';
import { useSessionAwareApiClient } from '../../../ui/api-helper.js';
import { confirmExitFileEditor } from '../../confirmation-dialogs.js';
import MediaLibraryMetadataForm from './media-library-metadata-form.js';
import MediaLibraryFilesDropzone from './media-library-files-dropzone.js';
import { mediaLibraryItemShape } from '../../../ui/default-prop-types.js';
import { processFileBeforeUpload } from '../../../utils/storage-utils.js';
import MediaLibraryMetadataDisplay from './media-library-metadata-display.js';
import MediaLibraryApiClient from '../../../api-clients/media-library-api-client.js';
import ResourcePreviewWithMetadata from '../shared/resource-preview-with-metadata.js';
import { STORAGE_FILE_UPLOAD_COUNT_LIMIT, STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES } from '../../../domain/constants.js';

const logger = new Logger(import.meta.url);

const createUploadItem = (t, file, allowUnlimitedUpload) => {
  if (!file) {
    return null;
  }

  const fileIsTooBig = !allowUnlimitedUpload && file.size > STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES;
  const errorMessage= fileIsTooBig
    ? t('common:fileIsTooBig', { limit: prettyBytes(STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES) })
    : null;

  return {
    file,
    isEdited: false,
    errorMessage
  };
};

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
  const allowUnlimitedUpload = usePermission(permissions.UPLOAD_WITHOUT_RESTRICTION);
  const dropzoneRef = useRef();
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const isMounted = useIsMounted();
  const imageEditorRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [isVisibleToUser, setIsVisibleToUser] = useState(false);
  const [isEditedImageDirty, setIsEditedImageDirty] = useState(false);
  const mediaLibraryApiClient = useSessionAwareApiClient(MediaLibraryApiClient);
  const [uploadItem, setUploadItem] = useState(createUploadItem(t, null, allowUnlimitedUpload));

  if (mode !== MEDIA_LIBRARY_ITEM_MODAL_MODE.create && !mediaLibraryItem) {
    throw new Error('Cannot preview or update without a media library item');
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setIsEditingImage(false);
    setIsVisibleToUser(true);
    setIsEditedImageDirty(false);
    setUploadItem(createUploadItem(t, null));
  }, [t, isOpen, mode, form]);

  useEffect(() => {
    if (isOpen && isVisibleToUser && mode !== MEDIA_LIBRARY_ITEM_MODAL_MODE.preview) {
      form.resetFields();
    }
  }, [isOpen, isVisibleToUser, mode, form]);

  const handleEditImageClick = () => {
    setIsEditingImage(true);
  };

  const handleImageEditorCrop = ({ isCropped }) => {
    setIsEditedImageDirty(isCropped);
  };

  const handleApplyImageEditorChanges = async () => {
    const newFile = await imageEditorRef.current.getCroppedFile();
    setUploadItem({ ...createUploadItem(t, newFile, allowUnlimitedUpload), isEdited: true });
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
      setUploadItem(createUploadItem(t, newFile, allowUnlimitedUpload));
    }
  };

  const handleCreateItemFinish = async ({ shortDescription, languages, licenses, allRightsReserved, tags, optimizeImages }) => {
    try {
      setIsSaving(true);
      const processedFile = await processFileBeforeUpload({ file: uploadItem.file, optimizeImages });
      const createdMediaLibraryItem = await mediaLibraryApiClient.createMediaLibraryItem({
        file: processedFile,
        shortDescription,
        languages,
        licenses,
        allRightsReserved,
        tags
      });

      message.success(t('common:changesSavedSuccessfully'));
      onSave(createdMediaLibraryItem);
    } catch (error) {
      handleApiError({ error, logger, t });
    } finally {
      setIsSaving(false);
    }
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
      setIsVisibleToUser(false);
    }
  };

  let dialogTitle;
  let dialogFooter;
  let dialogContent;
  let isDialogClosable;

  if (!isVisibleToUser) {
    isDialogClosable = false;
    dialogTitle = null;
    dialogContent = null;
    dialogFooter = null;
  } else if (mode === MEDIA_LIBRARY_ITEM_MODAL_MODE.preview) {
    isDialogClosable = true;
    dialogTitle = t('common:preview');
    dialogContent = (
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
    dialogFooter = (
      <div className="MediaLibaryItemModal-footer">
        <div className="MediaLibaryItemModal-footerButtons MediaLibaryItemModal-footerButtons--default">
          <Button type="primary" onClick={onClose}>{t('common:ok')}</Button>
        </div>
      </div>
    );
  } else if (mode === MEDIA_LIBRARY_ITEM_MODAL_MODE.update) {
    isDialogClosable = false;
    dialogTitle = t('common:edit');
    dialogContent = (
      <div className="MediaLibaryItemModal">
        <div className="MediaLibaryItemModal-name">
          {mediaLibraryItem.name}
        </div>
        <div className="MediaLibaryItemModal-splitView">
          <ResourcePreviewWithMetadata urlOrFile={mediaLibraryItem.url} size={mediaLibraryItem.size} />
          <MediaLibraryMetadataForm form={form} file={mediaLibraryItem} useOptimizeImages={false} onFinish={handleUpdateItemFinish} />
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
  } else if (mode === MEDIA_LIBRARY_ITEM_MODAL_MODE.create) {
    isDialogClosable = false;
    dialogTitle = t('common:create');
    if (isEditingImage) {
      dialogContent = (
        <div className="MediaLibaryItemModal">
          <div className="MediaLibaryItemModal-imageEditor">
            <ImageEditor
              file={uploadItem.file}
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
            <MediaLibraryFilesDropzone
              dropzoneRef={dropzoneRef}
              file={uploadItem?.file || null}
              canAcceptFile={!isSaving}
              errorMessage={uploadItem?.errorMessage}
              uploadLimit={allowUnlimitedUpload
                ? null
                : {
                  sizeInBytes: STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES,
                  fileCount: STORAGE_FILE_UPLOAD_COUNT_LIMIT
                }}
              onFileDrop={handleFileDrop}
              onEditImageClick={handleEditImageClick}
              />
            <MediaLibraryMetadataForm form={form} file={mediaLibraryItem} useOptimizeImages onFinish={handleCreateItemFinish} />
          </div>
        </div>
      );
      dialogFooter = (
        <div className="MediaLibaryItemModal-footer">
          <div className="MediaLibaryItemModal-footerButtons MediaLibaryItemModal-footerButtons--default">
            <Button onClick={onClose}>{t('common:cancel')}</Button>
            <Button type="primary" loading={isSaving} disabled={!uploadItem || !!uploadItem.errorMessage} onClick={handleSaveClick}>{t('common:save')}</Button>
          </div>
        </div>
      );
    }
  } else {
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
      afterOpenChange={handleAfterOpenChange}
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
