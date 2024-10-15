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
import FilesUploadViewer from '../shared/files-upload-viewer.js';
import { browserFileType } from '../../../ui/default-prop-types.js';
import { useSessionAwareApiClient } from '../../../ui/api-helper.js';
import MediaLibraryMetadataForm from './media-library-metadata-form.js';
import MediaLibraryFilesDropzone from './media-library-files-dropzone.js';
import MediaLibraryApiClient from '../../../api-clients/media-library-api-client.js';
import { isEditableImageFile, processFilesBeforeUpload } from '../../../utils/storage-utils.js';
import { STORAGE_FILE_UPLOAD_COUNT_LIMIT, STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES } from '../../../domain/constants.js';

const logger = new Logger(import.meta.url);

const STAGE = {
  enterData: 'enter-data',
  editImage: 'edit-image',
  createItems: 'create-items',
  selectFromCreatedItems: 'select-from-created-items'
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
  showHeadline,
  canGoBack,
  canSelect,
  uploadButtonText,
  onBackClick,
  onCancelClick,
  onSelectUrl,
  onUploadFinish
}) {
  const dropzoneRef = useRef();
  const [form] = Form.useForm();
  const { t } = useTranslation('mediaLibraryUploadScreen');
  const mediaLibraryApiClient = useSessionAwareApiClient(MediaLibraryApiClient);
  const allowUnlimitedUpload = usePermission(permissions.UPLOAD_WITHOUT_RESTRICTION);

  const [createdItems, setCreatedItems] = useState([]);
  const [currentStage, setCurrentStage] = useState(STAGE.enterData);
  const [currentEditedItemIndex, setCurrentEditedItemIndex] = useState(-1);
  const [currentSelectedItemIndex, setCurrentSelectedItemIndex] = useState(-1);
  const [currentPreviewedItemIndex, setCurrentPreviewedItemIndex] = useState(0);
  const [uploadItems, setUploadItems] = useState(createUploadItems(t, initialFiles, allowUnlimitedUpload));

  useEffect(() => {
    setCreatedItems([]);
    setCurrentEditedItemIndex(-1);
    setCurrentSelectedItemIndex(-1);
    setCurrentStage(STAGE.enterData);
    setCurrentPreviewedItemIndex(0);
    setUploadItems(createUploadItems(t, initialFiles, allowUnlimitedUpload));
  }, [t, allowUnlimitedUpload, initialFiles, form]);

  const isCurrentlyUploading = currentStage === STAGE.createItems;

  const handleDropzoneFilesDrop = droppedFiles => {
    if (!isCurrentlyUploading && droppedFiles?.length) {
      setCurrentPreviewedItemIndex(0);
      setUploadItems(createUploadItems(t, droppedFiles, allowUnlimitedUpload));
    }
  };

  const handleMetadataFormFinish = async ({ shortDescription, languages, licenses, allRightsReserved, tags, optimizeImages }) => {
    const errorFreeUploadItems = uploadItems.filter(item => !item.errorMessage);
    if (!errorFreeUploadItems.length) {
      return;
    }

    setCurrentStage(STAGE.createItems);
    setCreatedItems([]);

    const newlyCreatedItems = [];

    try {
      const filesToUpload = errorFreeUploadItems.map(item => item.file);
      const processedFiles = await processFilesBeforeUpload({ files: filesToUpload, optimizeImages });

      for (let i = 0; i < processedFiles.length; i += 1) {
        const file = processedFiles[i];

        const mediaLibraryItem = await mediaLibraryApiClient.createMediaLibraryItem({
          file,
          shortDescription,
          languages,
          licenses,
          allRightsReserved,
          tags
        });
        newlyCreatedItems.push({ file, status: FILE_UPLOAD_STATUS.succeeded, mediaLibraryItem });
      }

      setCurrentSelectedItemIndex(0);
      setCreatedItems(newlyCreatedItems);
      onUploadFinish(newlyCreatedItems.map(item => item.mediaLibraryItem));

      setCurrentStage(canSelect ? STAGE.selectFromCreatedItems : STAGE.enterData);
    } catch (error) {
      handleApiError({ error, logger, t });
    }
  };

  const handleCreateItemsClick = () => {
    form.submit();
  };

  const handleSelectButtonClick = () => {
    onSelectUrl(createdItems[currentSelectedItemIndex].mediaLibraryItem.portableUrl);
  };

  const handleDropzoneEditImageClick = index => {
    setCurrentEditedItemIndex(index);
    setCurrentStage(STAGE.editImage);
  };

  const handleEditorBackClick = () => {
    setCurrentEditedItemIndex(-1);
    setCurrentStage(STAGE.enterData);
  };

  const handleEditorApplyClick = newFile => {
    setUploadItems(uploadItems.map((item, index) => index !== currentEditedItemIndex ? item : { ...item, file: newFile, status: FILE_UPLOAD_STATUS.processed }));
    setCurrentEditedItemIndex(-1);
    setCurrentStage(STAGE.enterData);
  };

  const handleDropzonePreviewItemClick = index => {
    setCurrentPreviewedItemIndex(index);
  };

  const handleDropzoneClear = () => {
    setCurrentPreviewedItemIndex(-1);
    setUploadItems([]);
  };

  const handleUploadViewerItemClick = index => {
    setCurrentSelectedItemIndex(index);
  };

  if (currentStage === STAGE.editImage) {
    return (
      <FileEditorScreen
        file={uploadItems[currentEditedItemIndex].file}
        onCancelClick={onCancelClick}
        onBackClick={handleEditorBackClick}
        onApplyClick={handleEditorApplyClick}
        />
    );
  }

  if (currentStage === STAGE.selectFromCreatedItems) {
    return (
      <div className="u-resource-selector-screen">
        {!!showHeadline && <h3 className="u-resource-selector-screen-headline">{t('common:select')}</h3>}
        <div className="u-overflow-auto">
          <FilesUploadViewer
            canEdit={false}
            items={createdItems}
            previewedItemIndex={currentSelectedItemIndex}
            onItemClick={handleUploadViewerItemClick}
            />
        </div>

        <div className="u-resource-selector-screen-footer">
          {!!canGoBack && <Button onClick={onBackClick} icon={<ArrowLeftOutlined />}>{t('common:back')}</Button>}
          <div className="u-resource-selector-screen-footer-buttons">
            <Button onClick={onCancelClick}>{t('common:cancel')}</Button>
            <Button type="primary" onClick={handleSelectButtonClick}>{t('common:select')}</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="u-resource-selector-screen">
      {!!showHeadline && <h3 className="u-resource-selector-screen-headline">{t('uploadHeadline')}</h3>}
      <div className="u-overflow-auto">
        <div className="u-resource-selector-screen-content-split">
          <MediaLibraryFilesDropzone
            dropzoneRef={dropzoneRef}
            uploadItems={uploadItems}
            canAcceptFiles={!isCurrentlyUploading}
            previewedItemIndex={currentPreviewedItemIndex}
            uploadLimit={allowUnlimitedUpload
              ? null
              : {
                sizeInBytes: STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES,
                fileCount: STORAGE_FILE_UPLOAD_COUNT_LIMIT
              }}
            onFilesDrop={handleDropzoneFilesDrop}
            onEditImageClick={handleDropzoneEditImageClick}
            onPreviewItemClick={handleDropzonePreviewItemClick}
            onClear={handleDropzoneClear}
            />
          <MediaLibraryMetadataForm
            form={form}
            disableOptimizeImages={!uploadItems.some(item => item.isEditable)}
            onFinish={handleMetadataFormFinish}
            />
        </div>
      </div>
      <div className={canGoBack ? 'u-resource-selector-screen-footer' : 'u-resource-selector-screen-footer-right-aligned'}>
        {!!canGoBack && <Button onClick={onBackClick} icon={<ArrowLeftOutlined />} disabled={isCurrentlyUploading}>{t('common:back')}</Button>}
        <div className="u-resource-selector-screen-footer-buttons">
          <Button onClick={onCancelClick} disabled={isCurrentlyUploading}>{t('common:cancel')}</Button>
          <Button type="primary" onClick={handleCreateItemsClick} disabled={uploadItems.every(item => !!item.errorMessage)} loading={isCurrentlyUploading}>{uploadButtonText || t('common:upload')}</Button>
        </div>
      </div>
    </div>
  );
}

MediaLibraryUploadScreen.propTypes = {
  initialFiles: PropTypes.arrayOf(browserFileType),
  canGoBack: PropTypes.bool,
  canSelect: PropTypes.bool,
  showHeadline: PropTypes.bool,
  uploadButtonText: PropTypes.string,
  onBackClick: PropTypes.func,
  onCancelClick: PropTypes.func,
  onSelectUrl: PropTypes.func,
  onUploadFinish: PropTypes.func
};

MediaLibraryUploadScreen.defaultProps = {
  initialFiles: [],
  canGoBack: true,
  canSelect: true,
  showHeadline: true,
  uploadButtonText: null,
  onBackClick: () => {},
  onCancelClick: () => {},
  onSelectUrl: () => {},
  onUploadFinish: () => {},
};

export default MediaLibraryUploadScreen;
