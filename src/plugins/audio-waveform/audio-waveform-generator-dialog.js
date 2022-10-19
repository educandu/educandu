import PropTypes from 'prop-types';
import classNames from 'classnames';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import urlUtils from '../../utils/url-utils.js';
import { cssUrl } from '../../utils/css-utils.js';
import * as reactDropzoneNs from 'react-dropzone';
import { Button, Modal, Spin, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import HttpClient from '../../api-clients/http-client.js';
import { handleApiError } from '../../ui/error-helper.js';
import ColorPicker from '../../components/color-picker.js';
import ClientConfig from '../../bootstrap/client-config.js';
import React, { Fragment, useEffect, useState } from 'react';
import { getMediaSourceType } from '../../utils/media-utils.js';
import { useStorage } from '../../components/storage-context.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { useService } from '../../components/container-context.js';
import StorageApiClient from '../../api-clients/storage-api-client.js';
import { createWaveformImageUrl, extractPeaks } from './audio-waveform-utils.js';
import ResourcePickerDialog from '../../components/resource-picker/resource-picker-dialog.js';
import { IMAGE_OPTIMIZATION_THRESHOLD_WIDTH, MEDIA_SOURCE_TYPE, STORAGE_LOCATION_TYPE } from '../../domain/constants.js';
import { DEFAULT_WAVEFORM_BACKGROUND_COLOR, DEFAULT_WAVEFORM_BASELINE_COLOR, DEFAULT_WAVEFORM_PEN_COLOR } from './constants.js';

const useDropzone = reactDropzoneNs.default?.useDropzone || reactDropzoneNs.useDropzone;

const logger = new Logger(import.meta.url);

function AudioWaveformGeneratorDialog({ visible, onSelect, onCancel }) {
  const storage = useStorage();
  const { t } = useTranslation('audioWaveform');
  const clientConfig = useService(ClientConfig);
  const [imageUrl, setImageUrl] = useState(null);
  const httpClient = useSessionAwareApiClient(HttpClient);
  const [generatedPeaks, setGeneratedPeaks] = useState(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isGeneratingPeaks, setIsGeneratingPeaks] = useState(false);
  const storageApiClient = useSessionAwareApiClient(StorageApiClient);
  const [isCdnResourcePickerVisible, setIsCdnResourcePickerVisible] = useState(false);
  const [waveformPenColor, setWaveformPenColor] = useState(DEFAULT_WAVEFORM_PEN_COLOR);
  const [waveformBaselineColor, setWaveformBaselineColor] = useState(DEFAULT_WAVEFORM_BASELINE_COLOR);
  const [waveformBackgroundColor, setWaveformBackgroundColor] = useState(DEFAULT_WAVEFORM_BACKGROUND_COLOR);

  const homePath = storage.locations?.find(location => location.type === STORAGE_LOCATION_TYPE.public)?.homePath || null;

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

  const handleOk = async () => {
    const filename = 'waveform.png';

    let cdnUrl = null;
    setIsUploadingFile(true);
    try {
      const blob = await fetch(imageUrl).then(res => res.blob());
      const file = new File([blob], filename);
      const result = await storageApiClient.uploadFiles([file], homePath);
      cdnUrl = result.uploadedFiles[filename].portableUrl;
    } catch (error) {
      handleApiError({ error, logger, t });
    } finally {
      setIsUploadingFile(false);
    }

    if (cdnUrl) {
      onSelect(cdnUrl);
    }
  };

  const handleFileDrop = async fs => {
    if (!fs.length) {
      return;
    }

    const file = fs[0];
    const audioContext = new AudioContext();

    setIsGeneratingPeaks(true);
    setGeneratedPeaks(await extractPeaks(file, audioContext, IMAGE_OPTIMIZATION_THRESHOLD_WIDTH));
    setIsGeneratingPeaks(false);
  };

  const dropzone = useDropzone({
    maxFiles: 1,
    onDrop: handleFileDrop,
    noKeyboard: true,
    noClick: true
  });

  const handleOpenLocalFilePickerClick = () => {
    dropzone.open();
  };

  const handleOpenCdnFilePickerClick = () => {
    setIsCdnResourcePickerVisible(true);
  };

  const handleCdnResourcePickerSelect = async sourceUrl => {
    setIsCdnResourcePickerVisible(false);

    const audioContext = new AudioContext();

    const sourceType = getMediaSourceType({ sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
    const resolvedUrl = urlUtils.getMediaUrl({ sourceUrl, sourceType, cdnRootUrl: clientConfig.cdnRootUrl });

    const response = await httpClient.get(resolvedUrl, {
      responseType: 'blob',
      withCredentials: sourceType === MEDIA_SOURCE_TYPE.internal
    });

    setIsGeneratingPeaks(true);
    setGeneratedPeaks(await extractPeaks(response.data, audioContext, IMAGE_OPTIMIZATION_THRESHOLD_WIDTH));
    setIsGeneratingPeaks(false);
  };

  const handleCdnResourcePickerClose = () => {
    setIsCdnResourcePickerVisible(false);
  };

  const segmentsDropzoneClasses = classNames({
    'AudioWaveformGeneratorDialog-dropzone': true,
    'u-can-drop': dropzone.isDragAccept && !isGeneratingPeaks,
    'u-cannot-drop': dropzone.isDragReject || (dropzone.isDragAccept && isGeneratingPeaks)
  });

  return (
    <Fragment>
      <Modal
        centered
        width="80%"
        onOk={handleOk}
        visible={visible}
        onCancel={onCancel}
        title={t('dialogTitle')}
        okText={t('common:apply')}
        className="AudioWaveformGeneratorDialog"
        okButtonProps={{ disabled: !imageUrl || isGeneratingPeaks, loading: isUploadingFile }}
        >
        <Spin spinning={isGeneratingPeaks}>
          <div {...dropzone.getRootProps({ className: segmentsDropzoneClasses })}>
            <input {...dropzone.getInputProps()} hidden />
            <div
              className="AudioWaveformGeneratorDialog-previewArea"
              style={{ backgroundImage: imageUrl ? cssUrl(imageUrl) : 'none' }}
              >
              {!imageUrl && !isGeneratingPeaks && t('dialogDropzoneInfo')}
            </div>
            {!isGeneratingPeaks && (
            <div className="AudioWaveformGeneratorDialog-dropzoneInfo">
              <Tooltip title={t('dialogDropzoneInfo')}>
                <InfoCircleOutlined className="u-info-icon" />
              </Tooltip>
            </div>
            )}
          </div>
        </Spin>
        <div className="AudioWaveformGeneratorDialog-controls">
          <div>
            <span>{t('dialogLocalFilePickerPenColorLabel')}: </span>
            <ColorPicker color={waveformPenColor} onChange={setWaveformPenColor} inline />
          </div>
          <div>
            <span>{t('dialogLocalFilePickerBaselineColorLabel')}: </span>
            <ColorPicker color={waveformBaselineColor} onChange={setWaveformBaselineColor} inline />
          </div>
          <div>
            <span>{t('dialogLocalFilePickerBackgroundColorLabel')}: </span>
            <ColorPicker color={waveformBackgroundColor} onChange={setWaveformBackgroundColor} inline />
          </div>
        </div>
        <div className="AudioWaveformGeneratorDialog-controls">
          <Button onClick={handleOpenLocalFilePickerClick}>
            {t('dialogLocalFilePickerButtonText')}
          </Button>
          <Button onClick={handleOpenCdnFilePickerClick}>
            {t('dialogCdnFilePickerButtonText')}
          </Button>
        </div>
      </Modal>
      <ResourcePickerDialog
        isVisible={isCdnResourcePickerVisible}
        onSelect={handleCdnResourcePickerSelect}
        onClose={handleCdnResourcePickerClose}
        />
    </Fragment>
  );
}

AudioWaveformGeneratorDialog.propTypes = {
  onCancel: PropTypes.func,
  onSelect: PropTypes.func,
  visible: PropTypes.bool
};

AudioWaveformGeneratorDialog.defaultProps = {
  onCancel: () => {},
  onSelect: () => {},
  visible: false
};

export default AudioWaveformGeneratorDialog;
