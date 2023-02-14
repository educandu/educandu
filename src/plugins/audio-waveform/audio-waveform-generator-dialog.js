import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button, Modal, Spin } from 'antd';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import { cssUrl } from '../../utils/css-utils.js';
import * as reactDropzoneNs from 'react-dropzone';
import HttpClient from '../../api-clients/http-client.js';
import { handleApiError } from '../../ui/error-helper.js';
import ColorPicker from '../../components/color-picker.js';
import ClientConfig from '../../bootstrap/client-config.js';
import React, { Fragment, useEffect, useState } from 'react';
import { useStorage } from '../../components/storage-context.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { useService } from '../../components/container-context.js';
import StorageApiClient from '../../api-clients/storage-api-client.js';
import { createWaveformImageUrl, extractPeaks } from './audio-waveform-utils.js';
import { getAccessibleUrl, isInternalSourceType } from '../../utils/source-utils.js';
import ResourceSelectorDialog from '../../components/resource-selector/resource-selector-dialog.js';
import { IMAGE_OPTIMIZATION_THRESHOLD_WIDTH, STORAGE_LOCATION_TYPE } from '../../domain/constants.js';
import { DEFAULT_WAVEFORM_BACKGROUND_COLOR, DEFAULT_WAVEFORM_BASELINE_COLOR, DEFAULT_WAVEFORM_PEN_COLOR } from './constants.js';

const useDropzone = reactDropzoneNs.default?.useDropzone || reactDropzoneNs.useDropzone;

const logger = new Logger(import.meta.url);

function AudioWaveformGeneratorDialog({ isOpen, onSelect, onCancel }) {
  const storage = useStorage();
  const { t } = useTranslation('audioWaveform');
  const clientConfig = useService(ClientConfig);
  const [imageUrl, setImageUrl] = useState(null);
  const httpClient = useSessionAwareApiClient(HttpClient);
  const [generatedPeaks, setGeneratedPeaks] = useState(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isGeneratingPeaks, setIsGeneratingPeaks] = useState(false);
  const storageApiClient = useSessionAwareApiClient(StorageApiClient);
  const [waveformPenColor, setWaveformPenColor] = useState(DEFAULT_WAVEFORM_PEN_COLOR);
  const [isResourceSelectorDialogOpen, setIsResourceSelectorDialogOpen] = useState(false);
  const [waveformBaselineColor, setWaveformBaselineColor] = useState(DEFAULT_WAVEFORM_BASELINE_COLOR);
  const [waveformBackgroundColor, setWaveformBackgroundColor] = useState(DEFAULT_WAVEFORM_BACKGROUND_COLOR);

  const storagePath = storage.locations?.find(location => location.type === STORAGE_LOCATION_TYPE.documentMedia)?.path || null;

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
    } finally {
      setIsGeneratingPeaks(false);
    }
  };

  const handleOk = async () => {
    const filename = 'waveform.png';

    let cdnUrl = null;
    setIsUploadingFile(true);
    try {
      const blob = await fetch(imageUrl).then(res => res.blob());
      const file = new File([blob], filename);
      const result = await storageApiClient.uploadFiles([file], storagePath);
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

  const handleFileDrop = fs => {
    if (fs.length) {
      generatePeaks(() => Promise.resolve(fs[0]));
    }
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
        open={isOpen}
        onOk={handleOk}
        onCancel={onCancel}
        title={t('dialogTitle')}
        okText={t('common:apply')}
        className="AudioWaveformGeneratorDialog"
        okButtonProps={{ disabled: !imageUrl || isGeneratingPeaks, loading: isUploadingFile }}
        >
        <div className="u-modal-body">
          <Spin spinning={isGeneratingPeaks}>
            <div {...dropzone.getRootProps({ className: segmentsDropzoneClasses })}>
              <input {...dropzone.getInputProps()} hidden />
              <div
                className="AudioWaveformGeneratorDialog-previewArea"
                style={{ backgroundImage: imageUrl ? cssUrl(imageUrl) : 'none' }}
                >
                {!imageUrl && !isGeneratingPeaks && t('dialogDropzoneInfo')}
              </div>
            </div>
          </Spin>
          <div className="AudioWaveformGeneratorDialog-controls">
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
          <div className="AudioWaveformGeneratorDialog-controls">
            <Button onClick={handleOpenLocalFilePickerClick}>
              {t('dialogLocalFilePickerButtonText')}
            </Button>
            <Button onClick={handleOpenCdnFilePickerClick}>
              {t('dialogCdnFilePickerButtonText')}
            </Button>
          </div>
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
