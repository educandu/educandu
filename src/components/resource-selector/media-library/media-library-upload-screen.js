import PropTypes from 'prop-types';
import { Button, Form } from 'antd';
import prettyBytes from 'pretty-bytes';
import Logger from '../../../common/logger.js';
import { useTranslation } from 'react-i18next';
import { usePermission } from '../../../ui/hooks.js';
import { ArrowLeftOutlined } from '@ant-design/icons';
import permissions from '../../../domain/permissions.js';
import React, { useEffect, useRef, useState } from 'react';
import { handleApiError } from '../../../ui/error-helper.js';
import FileEditorScreen from '../shared/file-editor-screen.js';
import { browserFileType } from '../../../ui/default-prop-types.js';
import { useSessionAwareApiClient } from '../../../ui/api-helper.js';
import MediaLibraryMetadataForm from './media-library-metadata-form.js';
import MediaLibraryFileDropzone from './media-library-file-dropzone.js';
import ResourcePreviewScreen from '../shared/resource-preview-screen.js';
import { STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES } from '../../../domain/constants.js';
import MediaLibraryApiClient from '../../../api-clients/media-library-api-client.js';
import { isEditableImageFile, processFileBeforeUpload } from '../../../utils/storage-utils.js';

const logger = new Logger(import.meta.url);

const SCREEN = {
  enterData: 'enter-data',
  editImage: 'edit-image',
  createItem: 'create-item',
  previewCreatedItem: 'preview-created-item'
};

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

function MediaLibraryUploadScreen({
  initialFile,
  onBackClick,
  onCancelClick,
  onSelectNewUrl
}) {
  const allowUnlimitedUpload = usePermission(permissions.UPLOAD_WITHOUT_SIZE_RESTRICTION);
  const dropzoneRef = useRef();
  const [form] = Form.useForm();
  const { t } = useTranslation('mediaLibraryUploadScreen');
  const mediaLibraryApiClient = useSessionAwareApiClient(MediaLibraryApiClient);

  const [currentScreen, setCurrentScreen] = useState(SCREEN.enterData);
  const [createdMediaLibraryItem, setCreatedMediaLibraryItem] = useState(null);
  const [uploadItem, setUploadItem] = useState(createUploadItem(t, initialFile, allowUnlimitedUpload));

  useEffect(() => {
    setCreatedMediaLibraryItem(null);
    setCurrentScreen(SCREEN.enterData);
    setUploadItem(createUploadItem(t, initialFile, allowUnlimitedUpload));
  }, [t, allowUnlimitedUpload, initialFile, form]);

  const isCurrentlyUploading = currentScreen === SCREEN.createItem;
  const canEditImage = uploadItem && isEditableImageFile(uploadItem.file);

  const handleFileDrop = ([newFile]) => {
    if (!isCurrentlyUploading && newFile) {
      setUploadItem(createUploadItem(t, newFile, allowUnlimitedUpload));
    }
  };

  const handleMetadataFormFinish = async ({ shortDescription, languages, licenses, allRightsReserved, tags, optimizeImage }) => {
    const currentFile = uploadItem?.file || null;
    if (!currentFile) {
      return;
    }

    setCurrentScreen(SCREEN.createItem);
    try {
      const processedFile = await processFileBeforeUpload({ file: currentFile, optimizeImage });
      const result = await mediaLibraryApiClient.createMediaLibraryItem({
        file: processedFile,
        shortDescription,
        languages,
        licenses,
        allRightsReserved,
        tags
      });
      setCreatedMediaLibraryItem(result);
      setCurrentScreen(SCREEN.previewCreatedItem);
    } catch (error) {
      handleApiError({ error, logger, t });
    } finally {
      setCurrentScreen(SCREEN.previewCreatedItem);
    }
  };

  const handleCreateItemClick = () => {
    form.submit();
  };

  const handleSelectCreatedItemClick = () => {
    onSelectNewUrl(createdMediaLibraryItem.portableUrl);
  };

  const handleEditImageClick = () => {
    setCurrentScreen(SCREEN.editImage);
  };

  const handleEditorBackClick = () => {
    setCurrentScreen(SCREEN.enterData);
  };

  const handleEditorApplyClick = newFile => {
    setUploadItem({ ...createUploadItem(t, newFile, allowUnlimitedUpload), isEdited: true });
    setCurrentScreen(SCREEN.enterData);
  };

  if (currentScreen === SCREEN.editImage) {
    return (
      <FileEditorScreen
        file={uploadItem.file}
        onCancelClick={onCancelClick}
        onBackClick={handleEditorBackClick}
        onApplyClick={handleEditorApplyClick}
        />
    );
  }

  if (currentScreen === SCREEN.previewCreatedItem) {
    return (
      <ResourcePreviewScreen
        file={createdMediaLibraryItem}
        renderMediaLibraryMetadata
        onBackClick={onBackClick}
        onCancelClick={onCancelClick}
        onSelectClick={handleSelectCreatedItemClick}
        />
    );
  }

  return (
    <div className="u-resource-selector-screen">
      <h3 className="u-resource-selector-screen-headline">{t('uploadHeadline')}</h3>
      <div className="u-overflow-auto">
        <div className="u-resource-selector-screen-content-split">
          <MediaLibraryFileDropzone
            dropzoneRef={dropzoneRef}
            file={uploadItem?.file || null}
            canAcceptFile={!isCurrentlyUploading}
            uploadLimit={allowUnlimitedUpload ? null : STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES}
            errorMessage={uploadItem?.errorMessage}
            onFileDrop={handleFileDrop}
            onEditImageClick={handleEditImageClick}
            />
          <MediaLibraryMetadataForm form={form} disableOptimizeImage={!canEditImage} onFinish={handleMetadataFormFinish} />
        </div>
      </div>
      <div className="u-resource-selector-screen-footer">
        <Button onClick={onBackClick} icon={<ArrowLeftOutlined />} disabled={isCurrentlyUploading}>{t('common:back')}</Button>
        <div className="u-resource-selector-screen-footer-buttons">
          <Button onClick={onCancelClick} disabled={isCurrentlyUploading}>{t('common:cancel')}</Button>
          <Button type="primary" onClick={handleCreateItemClick} disabled={!uploadItem || !!uploadItem.errorMessage} loading={isCurrentlyUploading}>{t('common:upload')}</Button>
        </div>
      </div>
    </div>
  );
}

MediaLibraryUploadScreen.propTypes = {
  initialFile: browserFileType,
  onBackClick: PropTypes.func,
  onCancelClick: PropTypes.func,
  onSelectNewUrl: PropTypes.func
};

MediaLibraryUploadScreen.defaultProps = {
  initialFile: null,
  onBackClick: () => {},
  onCancelClick: () => {},
  onSelectNewUrl: () => {}
};

export default MediaLibraryUploadScreen;
