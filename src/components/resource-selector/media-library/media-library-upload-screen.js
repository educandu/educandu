import PropTypes from 'prop-types';
import { Button, Form } from 'antd';
import prettyBytes from 'pretty-bytes';
import Logger from '../../../common/logger.js';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../../locale-context.js';
import { usePermission } from '../../../ui/hooks.js';
import { ArrowLeftOutlined } from '@ant-design/icons';
import permissions from '../../../domain/permissions.js';
import React, { useEffect, useRef, useState } from 'react';
import { FILE_UPLOAD_STATUS } from '../shared/constants.js';
import { handleApiError } from '../../../ui/error-helper.js';
import { replaceItemAt } from '../../../utils/array-utils.js';
import FileEditorScreen from '../shared/file-editor-screen.js';
import FilesUploadViewer from '../shared/files-upload-viewer.js';
import { browserFileType } from '../../../ui/default-prop-types.js';
import { useSessionAwareApiClient } from '../../../ui/api-helper.js';
import MediaLibraryMetadataForm from './media-library-metadata-form.js';
import MediaLibraryFilesDropzone from './media-library-files-dropzone.js';
import MediaLibraryApiClient from '../../../api-clients/media-library-api-client.js';
import { isEditableImageFile, processFileBeforeUpload } from '../../../utils/storage-utils.js';
import { STORAGE_FILE_UPLOAD_COUNT_LIMIT, STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES } from '../../../domain/constants.js';

const logger = new Logger(import.meta.url);

const STAGE = {
  enterData: 'enter-data',
  editImage: 'edit-image',
  upload: 'upload',
  select: 'select'
};

const mapToUploadItem = (t, uiLocale, file, allowUnlimitedUpload) => {
  const fileIsTooBig = !allowUnlimitedUpload && file.size > STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES;

  return {
    file,
    isEditable: isEditableImageFile(file),
    status: fileIsTooBig ? FILE_UPLOAD_STATUS.failedValidation : FILE_UPLOAD_STATUS.pristine,
    errorMessage: fileIsTooBig
      ? t('common:fileIsTooBig', { limit: prettyBytes(STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES, { locale: uiLocale }) })
      : null
  };
};

const mapToUploadItems = (t, uiLocale, files, allowUnlimitedUpload) => {
  return files.map(file => mapToUploadItem(t, uiLocale, file, allowUnlimitedUpload));
};

const processFilesBeforeUpload = ({ items, optimizeImages }) => {
  return Promise.all(items.map(item =>
    item.status === FILE_UPLOAD_STATUS.failedValidation
      ? item.file
      : processFileBeforeUpload({ file: item.file, optimizeImages })
  ));
};

function MediaLibraryUploadScreen({
  initialFiles,
  showHeadline,
  canCancel,
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
  const { uiLocale } = useLocale();
  const { t } = useTranslation('mediaLibraryUploadScreen');
  const mediaLibraryApiClient = useSessionAwareApiClient(MediaLibraryApiClient);
  const allowUnlimitedUpload = usePermission(permissions.UPLOAD_WITHOUT_RESTRICTION);

  const [currentStage, setCurrentStage] = useState(STAGE.enterData);
  const [currentEditedItemIndex, setCurrentEditedItemIndex] = useState(-1);
  const [currentPreviewedItemIndex, setCurrentPreviewedItemIndex] = useState(0);
  const [uploadItems, setUploadItems] = useState(mapToUploadItems(t, uiLocale, initialFiles, allowUnlimitedUpload));

  useEffect(() => {
    setCurrentEditedItemIndex(-1);
    setCurrentStage(STAGE.enterData);
    setCurrentPreviewedItemIndex(0);
    setUploadItems(mapToUploadItems(t, uiLocale, initialFiles, allowUnlimitedUpload));
  }, [t, uiLocale, allowUnlimitedUpload, initialFiles, form]);

  const isCurrentlyUploading = currentStage === STAGE.upload;

  const handleDropzoneFilesDrop = droppedFiles => {
    if (!isCurrentlyUploading && droppedFiles?.length) {
      setCurrentPreviewedItemIndex(0);
      setUploadItems(mapToUploadItems(t, uiLocale, droppedFiles, allowUnlimitedUpload));
    }
  };

  const handleMetadataFormFinish = async ({ shortDescription, languages, licenses, allRightsReserved, tags, optimizeImages }) => {
    const allItemsFailedValidation = uploadItems.every(item => item.status === FILE_UPLOAD_STATUS.failedValidation);
    if (allItemsFailedValidation) {
      return;
    }

    setCurrentStage(STAGE.upload);

    try {
      const createdMediaLibraryItems = [];
      const processedFiles = await processFilesBeforeUpload({ items: uploadItems, optimizeImages });

      for (let i = 0; i < processedFiles.length; i += 1) {
        const isValidItem = uploadItems[i].status !== FILE_UPLOAD_STATUS.failedValidation;

        if (isValidItem) {
          const file = processedFiles[i];
          const currentItem = { ...uploadItems[i], file, status: FILE_UPLOAD_STATUS.uploading };

          setUploadItems(prevItems => replaceItemAt(prevItems, currentItem, i));

          let updatedItem;
          try {
            const mediaLibraryItem = await mediaLibraryApiClient.createMediaLibraryItem({
              file,
              shortDescription,
              languages,
              licenses,
              allRightsReserved,
              tags
            });

            updatedItem = {
              ...currentItem,
              status: FILE_UPLOAD_STATUS.succeededUpload,
              createdMediaLibraryItem: mediaLibraryItem
            };
            createdMediaLibraryItems.push(mediaLibraryItem);
          } catch (error) {
            updatedItem = {
              ...currentItem,
              status: FILE_UPLOAD_STATUS.failedUpload,
              errorMessage: error.message
            };
          }
          setUploadItems(prevItems => replaceItemAt(prevItems, updatedItem, i));
        }
      }

      if (uploadItems[currentPreviewedItemIndex].status === FILE_UPLOAD_STATUS.failedValidation) {
        const firstValidItemIndex = uploadItems.findIndex(item => item.status !== FILE_UPLOAD_STATUS.failedValidation);
        setCurrentPreviewedItemIndex(firstValidItemIndex);
      }
      onUploadFinish(createdMediaLibraryItems);
      setCurrentStage(STAGE.select);
    } catch (error) {
      handleApiError({ error, logger, t });
    }
  };

  const handleUploadClick = () => {
    form.submit();
  };

  const handleSelectButtonClick = () => {
    onSelectUrl(uploadItems[currentPreviewedItemIndex].createdMediaLibraryItem.portableUrl);
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
    setCurrentPreviewedItemIndex(index);
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

  if (currentStage === STAGE.select) {
    return (
      <div className="u-resource-selector-screen">
        <h3 className="u-resource-selector-screen-headline">
          {!!showHeadline && `${t('common:uploadFinished')} - ${t('common:selectAFile')}`}
        </h3>
        <div className="u-overflow-auto u-full-height">
          <FilesUploadViewer
            canEdit={false}
            items={uploadItems}
            showInvalidItems={false}
            previewedItemIndex={currentPreviewedItemIndex}
            onItemClick={handleUploadViewerItemClick}
            />
        </div>

        <div className="u-resource-selector-screen-footer">
          {!!canGoBack && <Button onClick={onBackClick} icon={<ArrowLeftOutlined />}>{t('common:back')}</Button>}
          <div className="u-resource-selector-screen-footer-buttons">
            {!!canCancel && <Button onClick={onCancelClick}>{t('common:cancel')}</Button>}
            {!!canSelect && (
              <Button type="primary" disabled={!uploadItems[currentPreviewedItemIndex]?.createdMediaLibraryItem} onClick={handleSelectButtonClick}>
                {t('common:select')}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="u-resource-selector-screen">
      {!!showHeadline && <h3 className="u-resource-selector-screen-headline">{t('uploadHeadline')}</h3>}
      <div className="u-overflow-auto u-full-height">
        <div className="u-resource-selector-screen-content-split">
          <MediaLibraryFilesDropzone
            dropzoneRef={dropzoneRef}
            uploadItems={uploadItems}
            readOnly={isCurrentlyUploading}
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
          <Button type="primary" onClick={handleUploadClick} disabled={uploadItems.every(item => !!item.errorMessage)} loading={isCurrentlyUploading}>{uploadButtonText || t('common:upload')}</Button>
        </div>
      </div>
    </div>
  );
}

MediaLibraryUploadScreen.propTypes = {
  initialFiles: PropTypes.arrayOf(browserFileType),
  canCancel: PropTypes.bool,
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
  canCancel: true,
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
