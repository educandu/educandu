import PropTypes from 'prop-types';
import classNames from 'classnames';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import { cssUrl } from '../../utils/css-utils.js';
import * as reactDropzoneNs from 'react-dropzone';
import { Button, Divider, Form, Modal, Spin } from 'antd';
import HttpClient from '../../api-clients/http-client.js';
import { handleApiError } from '../../ui/error-helper.js';
import ColorPicker from '../../components/color-picker.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { useService } from '../../components/container-context.js';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import { CloudUploadOutlined, SearchOutlined } from '@ant-design/icons';
import { IMAGE_OPTIMIZATION_THRESHOLD_WIDTH } from '../../domain/constants.js';
import { createWaveformImageUrl, extractPeaks } from './audio-waveform-utils.js';
import MediaLibraryApiClient from '../../api-clients/media-library-api-client.js';
import { getAccessibleUrl, isInternalSourceType } from '../../utils/source-utils.js';
import ActionInvitation from '../../components/resource-selector/shared/action-invitation.js';
import ResourceSelectorDialog from '../../components/resource-selector/resource-selector-dialog.js';
import MediaLibraryMetadataForm from '../../components/resource-selector/media-library/media-library-metadata-form.js';
import { DEFAULT_WAVEFORM_BACKGROUND_COLOR, DEFAULT_WAVEFORM_BASELINE_COLOR, DEFAULT_WAVEFORM_PEN_COLOR } from './constants.js';

const ReactDropzone = reactDropzoneNs.default || reactDropzoneNs;

const logger = new Logger(import.meta.url);

function AudioWaveformGeneratorDialog({ isOpen, onSelect, onCancel }) {
  const dropzoneRef = useRef();
  const [metadataForm] = Form.useForm();
  const { t } = useTranslation('audioWaveform');
  const clientConfig = useService(ClientConfig);
  const httpClient = useSessionAwareApiClient(HttpClient);
  const mediaLibraryApiClient = useSessionAwareApiClient(MediaLibraryApiClient);

  const [imageUrl, setImageUrl] = useState(null);
  const [generatedPeaks, setGeneratedPeaks] = useState(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isGeneratingPeaks, setIsGeneratingPeaks] = useState(false);
  const [waveformPenColor, setWaveformPenColor] = useState(DEFAULT_WAVEFORM_PEN_COLOR);
  const [isResourceSelectorDialogOpen, setIsResourceSelectorDialogOpen] = useState(false);
  const [waveformBaselineColor, setWaveformBaselineColor] = useState(DEFAULT_WAVEFORM_BASELINE_COLOR);
  const [waveformBackgroundColor, setWaveformBackgroundColor] = useState(DEFAULT_WAVEFORM_BACKGROUND_COLOR);

  useEffect(() => {
    if (!generatedPeaks) {
      setImageUrl(null);
      return () => {};
    }

    const url = createWaveformImageUrl({
      peaks: generatedPeaks,
      width: IMAGE_OPTIMIZATION_THRESHOLD_WIDTH,
      height: Math.round(IMAGE_OPTIMIZATION_THRESHOLD_WIDTH / 2.5),
      penWidth: 2,
      smoothing: true,
      penColor: waveformPenColor,
      baselineColor: waveformBaselineColor,
      backgroundColor: waveformBackgroundColor
    });

    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [generatedPeaks, waveformPenColor, waveformBaselineColor, waveformBackgroundColor]);

  const generatePeaks = async getAudioFileFunc => {
    setIsGeneratingPeaks(true);

    const audioContext = new AudioContext();

    try {
      const blob = await getAudioFileFunc();
      const peaks = await extractPeaks(blob, audioContext, IMAGE_OPTIMIZATION_THRESHOLD_WIDTH);
      setGeneratedPeaks(peaks);
    } catch (error) {
      handleApiError({ error, logger, t });
      setGeneratedPeaks(null);
    } finally {
      setIsGeneratingPeaks(false);
    }
  };

  const uploadFileToMediaLibrary = async ({ description, languages, licenses, tags }) => {
    const filename = 'waveform.png';

    let cdnUrl = null;
    setIsUploadingFile(true);
    try {
      const blob = await fetch(imageUrl).then(res => res.blob());
      const file = new File([blob], filename);

      const uploadedFile = await mediaLibraryApiClient.createMediaLibraryItem({
        file,
        description,
        languages,
        licenses,
        tags
      });

      cdnUrl = uploadedFile.portableUrl;
    } catch (error) {
      handleApiError({ error, logger, t });
    } finally {
      setIsUploadingFile(false);
    }

    return cdnUrl;
  };

  const handleFileDrop = file => {
    generatePeaks(() => Promise.resolve(file));
  };

  const handleUploadAudioFileButtonClick = () => {
    dropzoneRef.current.open();
  };

  const handleSearchAudioFileButtonClick = () => {
    setIsResourceSelectorDialogOpen(true);
  };

  const handleResourceSelectorDialogSelect = sourceUrl => {
    setIsResourceSelectorDialogOpen(false);
    generatePeaks(async () => {
      const url = getAccessibleUrl({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });

      const response = await httpClient.get(url, {
        responseType: 'blob',
        withCredentials: isInternalSourceType({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })
      });

      return response.data;
    });
  };

  const handleResourceSelectorDialogClose = () => {
    setIsResourceSelectorDialogOpen(false);
  };

  const handleRegenerateImageButtonClick = () => {
    setImageUrl(null);
    setGeneratedPeaks(null);
  };

  const handleModalOk = () => {
    metadataForm.submit();
  };

  const handleMetadataFormFinish = async metadata => {
    const cdnUrl = await uploadFileToMediaLibrary(metadata);
    if (cdnUrl) {
      setImageUrl(null);
      setGeneratedPeaks(null);
      metadataForm.resetFields();
      onSelect(cdnUrl);
    }
  };

  const getDropzoneClasses = isDragActive => classNames(
    'AudioWaveformGeneratorDialog-dropzone',
    { 'is-dropping': isDragActive && !isGeneratingPeaks },
    { 'is-drop-rejected': isDragActive && isGeneratingPeaks }
  );

  const renderDropzone = () => {
    return (
      <ReactDropzone ref={dropzoneRef} noClick noKeyboard onDrop={fs => fs.length && handleFileDrop(fs[0])}>
        {({ getRootProps, getInputProps, isDragActive }) => (
          <div {...getRootProps({ className: getDropzoneClasses(isDragActive) })}>
            <div className="AudioWaveformGeneratorDialog-dropzoneContent">
              <input {...getInputProps()} hidden />
              <ActionInvitation
                icon={<SearchOutlined />}
                title={t('dialogSearchFileInvitationHeader')}
                subtitle={(
                  <Button type="primary" onClick={handleSearchAudioFileButtonClick}>
                    {t('common:browseFilesButtonLabel')}
                  </Button>
                )}
                />
              <div className="AudioWaveformGeneratorDialog-dropzoneContentDivider">
                <Divider plain>{t('common:or')}</Divider>
              </div>
              <ActionInvitation
                icon={<CloudUploadOutlined />}
                title={t('dialogDropFileInvitationHeader')}
                subtitle={(
                  <Button type="primary" onClick={handleUploadAudioFileButtonClick}>
                    {t('common:browseFilesButtonLabel')}
                  </Button>
                )}
                />
            </div>
          </div>
        )}
      </ReactDropzone>
    );
  };

  const renderGeneratingPeaks = () => {
    return (
      <div className={classNames('AudioWaveformGeneratorDialog-spin')}>
        <Spin size="large" />
      </div>
    );
  };

  const renderGeneratedWafevorm = () => {
    return (
      <div className="AudioWaveformGeneratorDialog-generatedWaveform">
        <div
          className="AudioWaveformGeneratorDialog-generatedWaveformImage"
          style={{ backgroundImage: cssUrl(imageUrl) }}
          />
        <Button onClick={handleRegenerateImageButtonClick}>{t('dialogRegenerateButton')}</Button>
      </div>
    );
  };

  const renderColorPickers = () => {
    return (
      <div className="AudioWaveformGeneratorDialog-colorPickers">
        <div>
          <span>{t('penColor')}: </span>
          <ColorPicker color={waveformPenColor} onChange={setWaveformPenColor} inline />
        </div>
        <div>
          <span>{t('baselineColor')}: </span>
          <ColorPicker color={waveformBaselineColor} onChange={setWaveformBaselineColor} inline />
        </div>
        <div>
          <span>{t('backgroundColor')}: </span>
          <ColorPicker color={waveformBackgroundColor} onChange={setWaveformBackgroundColor} inline />
        </div>
      </div>
    );
  };

  return (
    <Fragment>
      <Modal
        centered
        open={isOpen}
        onOk={handleModalOk}
        onCancel={onCancel}
        title={t('generateWaveformImage')}
        okText={t('dialogOkText')}
        className="AudioWaveformGeneratorDialog"
        okButtonProps={{ disabled: !imageUrl || isGeneratingPeaks, loading: isUploadingFile }}
        >
        <div className="AudioWaveformGeneratorDialog-body u-modal-body">
          <div className="AudioWaveformGeneratorDialog-bodyColumn">
            {!imageUrl && !isGeneratingPeaks && renderDropzone()}
            {!imageUrl && !!isGeneratingPeaks && renderGeneratingPeaks()}
            {!!imageUrl && renderGeneratedWafevorm()}
            {renderColorPickers()}
          </div>
          <MediaLibraryMetadataForm form={metadataForm} onFinish={handleMetadataFormFinish} />
        </div>
      </Modal>
      <ResourceSelectorDialog
        isOpen={isResourceSelectorDialogOpen}
        onSelect={handleResourceSelectorDialogSelect}
        onClose={handleResourceSelectorDialogClose}
        />
    </Fragment>
  );
}

AudioWaveformGeneratorDialog.propTypes = {
  isOpen: PropTypes.bool,
  onCancel: PropTypes.func,
  onSelect: PropTypes.func
};

AudioWaveformGeneratorDialog.defaultProps = {
  isOpen: false,
  onCancel: () => {},
  onSelect: () => {}
};

export default AudioWaveformGeneratorDialog;
