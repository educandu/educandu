import PropTypes from 'prop-types';
import { Button, Form } from 'antd';
import prettyBytes from 'pretty-bytes';
import Logger from '../../../common/logger.js';
import { useTranslation } from 'react-i18next';
import { usePermission } from '../../../ui/hooks.js';
import { ArrowLeftOutlined } from '@ant-design/icons';
import permissions from '../../../domain/permissions.js';
import React, { useEffect, useRef, useState } from 'react';
import { FILE_UPLOAD_STATUS } from '../shared/constants.js';
import { handleApiError } from '../../../ui/error-helper.js';
import FileEditorScreen from '../shared/file-editor-screen.js';
import { browserFileType } from '../../../ui/default-prop-types.js';
import { useSessionAwareApiClient } from '../../../ui/api-helper.js';
import MediaLibraryMetadataForm from './media-library-metadata-form.js';
import ResourcePreviewScreen from '../shared/resource-preview-screen.js';
import MediaLibraryFilesDropzone from './media-library-files-dropzone.js';
import MediaLibraryApiClient from '../../../api-clients/media-library-api-client.js';
import { isEditableImageFile, processFilesBeforeUpload } from '../../../utils/storage-utils.js';
import { STORAGE_FILE_UPLOAD_COUNT_LIMIT, STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES } from '../../../domain/constants.js';

const logger = new Logger(import.meta.url);

const SCREEN = {
  enterData: 'enter-data',
  editImage: 'edit-image',
  createItem: 'create-item',
  previewCreatedItem: 'preview-created-item'
};

const createUploadItem = (t, file, allowUnlimitedUpload) => {
  const fileIsTooBig = !allowUnlimitedUpload && file.size > STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES;
  const errorMessage = fileIsTooBig
    ? t('common:fileIsTooBig', { limit: prettyBytes(STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES) })
    : null;

  return {
    file,
    isEditable: isEditableImageFile(file),
    status: errorMessage ? FILE_UPLOAD_STATUS.failed : FILE_UPLOAD_STATUS.pristine,
    errorMessage
  };
};

const createUploadItems = (t, files, allowUnlimitedUpload) => {
  return files.map(file => createUploadItem(t, file, allowUnlimitedUpload));
};

function MediaLibraryUploadScreen({
  initialFiles,
  onBackClick,
  onCancelClick,
  onSelectNewUrl
}) {
  const dropzoneRef = useRef();
  const [form] = Form.useForm();
  const { t } = useTranslation('mediaLibraryUploadScreen');
  const mediaLibraryApiClient = useSessionAwareApiClient(MediaLibraryApiClient);
  const allowUnlimitedUpload = usePermission(permissions.UPLOAD_WITHOUT_RESTRICTION);

  const [currentScreen, setCurrentScreen] = useState(SCREEN.enterData);
  const [currentEditedFileIndex, setCurrentEditedFileIndex] = useState(-1);
  const [createdMediaLibraryItems, setCreatedMediaLibraryItems] = useState([]);
  const [currentPreviewedFileIndex, setCurrentPreviewedFileIndex] = useState(initialFiles.length ? 0 : -1);
  const [uploadItems, setUploadItems] = useState(createUploadItems(t, initialFiles, allowUnlimitedUpload));

  useEffect(() => {
    setCurrentEditedFileIndex(-1);
    setCreatedMediaLibraryItems([]);
    setCurrentScreen(SCREEN.enterData);
    setUploadItems(createUploadItems(t, initialFiles, allowUnlimitedUpload));
  }, [t, allowUnlimitedUpload, initialFiles, form]);

  const isCurrentlyUploading = currentScreen === SCREEN.createItem;

  const handleFilesDrop = droppedFiles => {
    if (!isCurrentlyUploading && droppedFiles?.length) {
      setUploadItems(createUploadItems(t, droppedFiles, allowUnlimitedUpload));
    }
  };

  const handleMetadataFormFinish = async ({ shortDescription, languages, licenses, allRightsReserved, tags, optimizeImages }) => {
    const filesToUpload = uploadItems.filter(item => !item.errorMessage).map(item => item.file);
    if (!filesToUpload.length) {
      return;
    }

    setCurrentScreen(SCREEN.createItem);
    const mediaLibraryItems = [];

    try {
      const processedFiles = await processFilesBeforeUpload({ files: filesToUpload, optimizeImages });

      for (let i = 0; i < processedFiles.length; i += 1) {
        const result = await mediaLibraryApiClient.createMediaLibraryItem({
          file: processedFiles[i],
          shortDescription,
          languages,
          licenses,
          allRightsReserved,
          tags
        });
        mediaLibraryItems.push(result);
      }
      setCreatedMediaLibraryItems(mediaLibraryItems);
      setCurrentScreen(SCREEN.previewCreatedItem);
    } catch (error) {
      handleApiError({ error, logger, t });
    } finally {
      setCurrentScreen(SCREEN.previewCreatedItem);
    }
  };

  const handleCreateItemsClick = () => {
    form.submit();
  };

  const handleSelectCreatedItemClick = () => {
    onSelectNewUrl(createdMediaLibraryItems[0].portableUrl);
  };

  const handleEditImageClick = fileIndex => {
    setCurrentEditedFileIndex(fileIndex);
    setCurrentScreen(SCREEN.editImage);
  };

  const handleEditorBackClick = () => {
    setCurrentEditedFileIndex(-1);
    setCurrentScreen(SCREEN.enterData);
  };

  const handleEditorApplyClick = newFile => {
    setUploadItems(uploadItems.map((item, index) => index !== currentEditedFileIndex ? item : { ...item, file: newFile, status: FILE_UPLOAD_STATUS.processed }));
    setCurrentEditedFileIndex(-1);
    setCurrentScreen(SCREEN.enterData);
  };

  const handleFileClick = fileIndex => {
    setCurrentPreviewedFileIndex(fileIndex);
  };

  if (currentScreen === SCREEN.editImage) {
    return (
      <FileEditorScreen
        file={uploadItems[currentEditedFileIndex].file}
        onCancelClick={onCancelClick}
        onBackClick={handleEditorBackClick}
        onApplyClick={handleEditorApplyClick}
        />
    );
  }

  if (currentScreen === SCREEN.previewCreatedItem) {
    return (
      <ResourcePreviewScreen
        file={createdMediaLibraryItems[0]}
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
          <MediaLibraryFilesDropzone
            dropzoneRef={dropzoneRef}
            uploadItems={uploadItems}
            canAcceptFiles={!isCurrentlyUploading}
            previewedItemIndex={currentPreviewedFileIndex}
            uploadLimit={allowUnlimitedUpload
              ? null
              : {
                sizeInBytes: STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES,
                fileCount: STORAGE_FILE_UPLOAD_COUNT_LIMIT
              }}
            onFilesDrop={handleFilesDrop}
            onEditImageClick={handleEditImageClick}
            onPreviewItemClick={handleFileClick}
            />
          <div className='u-resource-selector-screen-content-right-column'>
            <MediaLibraryMetadataForm
              form={form}
              disableOptimizeImages={!uploadItems.some(item => item.isEditable)}
              onFinish={handleMetadataFormFinish}
              />
          </div>
        </div>
      </div>
      <div className="u-resource-selector-screen-footer">
        <Button onClick={onBackClick} icon={<ArrowLeftOutlined />} disabled={isCurrentlyUploading}>{t('common:back')}</Button>
        <div className="u-resource-selector-screen-footer-buttons">
          <Button onClick={onCancelClick} disabled={isCurrentlyUploading}>{t('common:cancel')}</Button>
          <Button type="primary" onClick={handleCreateItemsClick} disabled={uploadItems.every(item => !!item.errorMessage)} loading={isCurrentlyUploading}>{t('common:upload')}</Button>
        </div>
      </div>
    </div>
  );
}

MediaLibraryUploadScreen.propTypes = {
  initialFiles: PropTypes.arrayOf(browserFileType),
  onBackClick: PropTypes.func,
  onCancelClick: PropTypes.func,
  onSelectNewUrl: PropTypes.func
};

MediaLibraryUploadScreen.defaultProps = {
  initialFiles: [],
  onBackClick: () => {},
  onCancelClick: () => {},
  onSelectNewUrl: () => {}
};

export default MediaLibraryUploadScreen;
