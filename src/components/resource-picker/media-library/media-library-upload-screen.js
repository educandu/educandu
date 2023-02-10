import PropTypes from 'prop-types';
import classNames from 'classnames';
import TagSelect from '../../tag-select.js';
import reactDropzoneNs from 'react-dropzone';
import Logger from '../../../common/logger.js';
import { useTranslation } from 'react-i18next';
import LicenseSelect from '../../license-select.js';
import FileEditorScreen from '../file-editor-screen.js';
import ResourceDetails from '../shared/resource-details.js';
import { handleApiError } from '../../../ui/error-helper.js';
import ActionInvitation from '../shared/action-invitation.js';
import { Button, Checkbox, Divider, Form, Input } from 'antd';
import LanguageSelect from '../../localization/language-select.js';
import { browserFileType } from '../../../ui/default-prop-types.js';
import { useSessionAwareApiClient } from '../../../ui/api-helper.js';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import { ArrowLeftOutlined, CloudUploadOutlined } from '@ant-design/icons';
import SelectedResourceDisplay from '../shared/selected-resource-display.js';
import MediaLibraryApiClient from '../../../api-clients/media-library-api-client.js';
import { isEditableImageFile, processFileBeforeUpload } from '../../../utils/storage-utils.js';

const FormItem = Form.Item;
const TextArea = Input.TextArea;
const ReactDropzone = reactDropzoneNs.default || reactDropzoneNs;

const logger = new Logger(import.meta.url);

const SCREEN = {
  enterData: 'enter-data',
  editImage: 'edit-image',
  createItem: 'create-item',
  previewCreatedItem: 'preview-created-item'
};

const createFileInfo = file => file ? { file, isEdited: false } : null;

const initialFormValues = {
  description: '',
  languages: [],
  licenses: [],
  tags: [],
  optimizeImage: true
};

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
    form.resetFields();
  }, [initialFile, form]);

  const isCurrentlyUploading = currentScreen === SCREEN.createItem;
  const canEditImage = fileInfo && isEditableImageFile(fileInfo.file);

  const handleMediaLibraryTagSuggestionsNeeded = searchText => {
    return mediaLibraryApiClient.getMediaLibraryTagSuggestions(searchText).catch(error => {
      handleApiError({ error, logger, t });
      return [];
    });
  };

  const handleUploadButtonClick = () => {
    dropzoneRef.current.open();
  };

  const handleFileDrop = ([newFile]) => {
    if (!isCurrentlyUploading && newFile) {
      setFileInfo(createFileInfo(newFile));
    }
  };

  const handleFinish = async ({ description, languages, licenses, tags, optimizeImage }) => {
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

  const getPreviewAreaClasses = isDragActive => classNames({
    'MediaLibraryUploadScreen-previewContent': true,
    'MediaLibraryUploadScreen-previewContent--canDrop': !isCurrentlyUploading,
    'is-drag-active': !isCurrentlyUploading && isDragActive
  });

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
      <div className="MediaLibraryUploadScreen u-resource-picker-screen">
        <h3>{t('previewHeadline')}</h3>
        <div className="MediaLibraryUploadScreen-content u-resource-picker-screen-content">
          <ResourceDetails
            url={createdItem.url}
            size={createdItem.size}
            createdOn={createdItem.createdOn}
            updatedOn={createdItem.updatedOn}
            />
        </div>
        <div className="u-resource-picker-screen-footer">
          <Button onClick={onBackClick} icon={<ArrowLeftOutlined />}>{t('common:back')}</Button>
          <div className="u-resource-picker-screen-footer-buttons">
            <Button onClick={onCancelClick}>{t('common:cancel')}</Button>
            <Button type="primary" onClick={handleSelectCreatedItemClick}>{t('common:select')}</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="MediaLibraryUploadScreen u-resource-picker-screen">
      <h3>{t('uploadHeadline')}</h3>
      <div className="MediaLibraryUploadScreen-content u-resource-picker-screen-content">
        <div className="MediaLibraryUploadScreen-editor">
          <div className="MediaLibraryUploadScreen-previewArea">
            <ReactDropzone ref={dropzoneRef} onDrop={handleFileDrop} noKeyboard noClick>
              {({ getRootProps, getInputProps, isDragActive }) => (
                <div {...getRootProps({ className: getPreviewAreaClasses(isDragActive) })}>
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
              )}
            </ReactDropzone>
          </div>
          <div className="MediaLibraryUploadScreen-editorArea">
            <Form form={form} layout="vertical" initialValues={initialFormValues} onFinish={handleFinish}>
              <FormItem name="description" label={t('description')}>
                <TextArea rows={3} />
              </FormItem>
              <FormItem name="languages" label={t('languages')}>
                <LanguageSelect multi />
              </FormItem>
              <FormItem name="licenses" label={t('licenses')} rules={[{ required: true, message: t('licensesRequired') }]}>
                <LicenseSelect multi />
              </FormItem>
              <FormItem name="tags" label={t('tags')} rules={[{ required: true, message: t('tagsRequired') }]}>
                <TagSelect onSuggestionsNeeded={handleMediaLibraryTagSuggestionsNeeded} />
              </FormItem>
              <FormItem name="optimizeImage" valuePropName="checked">
                <Checkbox disabled={!canEditImage}>{t('optimizeImage')}</Checkbox>
              </FormItem>
            </Form>
          </div>
        </div>
      </div>
      <div className="u-resource-picker-screen-footer">
        <Button onClick={onBackClick} icon={<ArrowLeftOutlined />} disabled={isCurrentlyUploading}>{t('common:back')}</Button>
        <div className="u-resource-picker-screen-footer-buttons">
          <Button onClick={onCancelClick} disabled={isCurrentlyUploading}>{t('common:cancel')}</Button>
          <Button type="primary" onClick={handleCreateItemClick} disabled={!fileInfo} loading={isCurrentlyUploading}>{t('common:create')}</Button>
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
