import PropTypes from 'prop-types';
import classNames from 'classnames';
import reactDropzoneNs from 'react-dropzone';
import { Button, Divider, Form } from 'antd';
import Logger from '../../../common/logger.js';
import { useTranslation } from 'react-i18next';
import { handleApiError } from '../../../ui/error-helper.js';
import ActionInvitation from '../shared/action-invitation.js';
import FileEditorScreen from '../shared/file-editor-screen.js';
import { browserFileType } from '../../../ui/default-prop-types.js';
import { useSessionAwareApiClient } from '../../../ui/api-helper.js';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import MediaLibraryMetadataForm from './media-library-metadata-form.js';
import ResourcePreviewScreen from '../shared/resource-preview-screen.js';
import { ArrowLeftOutlined, CloudUploadOutlined } from '@ant-design/icons';
import SelectedResourceDisplay from '../shared/selected-resource-display.js';
import MediaLibraryApiClient from '../../../api-clients/media-library-api-client.js';
import { isEditableImageFile, processFileBeforeUpload } from '../../../utils/storage-utils.js';

const ReactDropzone = reactDropzoneNs.default || reactDropzoneNs;

const logger = new Logger(import.meta.url);

const SCREEN = {
  enterData: 'enter-data',
  editImage: 'edit-image',
  createItem: 'create-item',
  previewCreatedItem: 'preview-created-item'
};

const createFileInfo = file => file ? { file, isEdited: false } : null;

function MediaLibraryUploadScreen({
  initialFile,
  onBackClick,
  onCancelClick,
  onSelectNewUrl
}) {
  const dropzoneRef = useRef();
  const [form] = Form.useForm();
  const [createdItem, setCreatedItem] = useState(null);
  const { t } = useTranslation('mediaLibraryUploadScreen');
  const [currentScreen, setCurrentScreen] = useState(SCREEN.enterData);
  const [fileInfo, setFileInfo] = useState(createFileInfo(initialFile));
  const mediaLibraryApiClient = useSessionAwareApiClient(MediaLibraryApiClient);

  useEffect(() => {
    setCreatedItem(null);
    setCurrentScreen(SCREEN.enterData);
    setFileInfo(createFileInfo(initialFile));
  }, [initialFile, form]);

  const isCurrentlyUploading = currentScreen === SCREEN.createItem;
  const canEditImage = fileInfo && isEditableImageFile(fileInfo.file);

  const handleUploadButtonClick = () => {
    dropzoneRef.current.open();
  };

  const handleFileDrop = ([newFile]) => {
    if (!isCurrentlyUploading && newFile) {
      setFileInfo(createFileInfo(newFile));
    }
  };

  const handleMetadataFormFinish = async ({ description, languages, licenses, tags, optimizeImage }) => {
    const currentFile = fileInfo?.file || null;
    if (!currentFile) {
      return;
    }

    setCurrentScreen(SCREEN.createItem);
    try {
      const processedFile = await processFileBeforeUpload({ file: currentFile, optimizeImage });
      const result = await mediaLibraryApiClient.createMediaLibraryItem({
        file: processedFile,
        description,
        languages,
        licenses,
        tags
      });
      setCreatedItem(result);
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
    onSelectNewUrl(createdItem.portableUrl);
  };

  const handleEditImageClick = () => {
    setCurrentScreen(SCREEN.editImage);
  };

  const handleEditorBackClick = () => {
    setCurrentScreen(SCREEN.enterData);
  };

  const handleEditorApplyClick = newFile => {
    setFileInfo({ file: newFile, isEdited: true });
    setCurrentScreen(SCREEN.enterData);
  };

  const getPreviewAreaClasses = isDragActive => classNames(
    'MediaLibraryUploadScreen-previewArea',
    { 'is-dropping': !isCurrentlyUploading && isDragActive },
    { 'is-drop-rejected': isCurrentlyUploading && isDragActive }
  );

  if (currentScreen === SCREEN.editImage) {
    return (
      <FileEditorScreen
        file={fileInfo.file}
        onCancelClick={onCancelClick}
        onBackClick={handleEditorBackClick}
        onApplyClick={handleEditorApplyClick}
        />
    );
  }

  if (currentScreen === SCREEN.previewCreatedItem) {
    return (
      <ResourcePreviewScreen
        file={createdItem}
        renderMediaLibraryMetadata
        onBackClick={onBackClick}
        onCancelClick={onCancelClick}
        onSelectClick={handleSelectCreatedItemClick}
        />
    );
  }

  return (
    <div className="MediaLibraryUploadScreen u-resource-selector-screen">
      <h3 className="u-resource-selector-screen-headline">{t('uploadHeadline')}</h3>
      <div className="u-overflow-auto">
        <div className="u-resource-selector-screen-content-split">

          <ReactDropzone ref={dropzoneRef} onDrop={handleFileDrop} noKeyboard noClick>
            {({ getRootProps, getInputProps, isDragActive }) => (
              <div {...getRootProps({ className: getPreviewAreaClasses(isDragActive) })}>
                <div className="MediaLibraryUploadScreen-previewAreaContent">
                  <input {...getInputProps()} hidden />
                  {!!fileInfo && (
                    <Fragment>
                      <SelectedResourceDisplay
                        urlOrFile={fileInfo.file}
                        footer={(
                          <Fragment>
                            <div>{t('fileWillBeAddedToMediaLibrary')}</div>
                            {!!canEditImage && (
                            <div>
                              <Button type="primary" onClick={handleEditImageClick}>
                                {t('common:edit')}
                              </Button>
                            </div>
                            )}
                          </Fragment>
                        )}
                        />
                      <div className="MediaLibraryUploadScreen-divider">
                        <Divider plain>{t('common:or')}</Divider>
                      </div>
                    </Fragment>
                  )}

                  <ActionInvitation
                    icon={<CloudUploadOutlined />}
                    title={t('common:dropDifferentFileInvitation')}
                    subtitle={(
                      <Button type="primary" onClick={handleUploadButtonClick}>
                        {t('common:browseFilesButtonLabel')}
                      </Button>
                    )}
                    />
                </div>
              </div>
            )}
          </ReactDropzone>

          <MediaLibraryMetadataForm form={form} disableOptimizeImage={!canEditImage} onFinish={handleMetadataFormFinish} />
        </div>
      </div>
      <div className="u-resource-selector-screen-footer">
        <Button onClick={onBackClick} icon={<ArrowLeftOutlined />} disabled={isCurrentlyUploading}>{t('common:back')}</Button>
        <div className="u-resource-selector-screen-footer-buttons">
          <Button onClick={onCancelClick} disabled={isCurrentlyUploading}>{t('common:cancel')}</Button>
          <Button type="primary" onClick={handleCreateItemClick} disabled={!fileInfo} loading={isCurrentlyUploading}>{t('common:upload')}</Button>
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
