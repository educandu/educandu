import { useTranslation } from 'react-i18next';
import React, { Fragment, useState } from 'react';
import UrlInput from '../../components/url-input.js';
import { Button, Divider, Form, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import ClientConfig from '../../bootstrap/client-config.js';
import { ensureIsExcluded } from '../../utils/array-utils.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import validation, { URL_VALIDATION_STATUS } from '../../ui/validation.js';
import AudioWaveformGeneratorDialog from './audio-waveform-generator-dialog.js';
import { getPersistableUrl, isInternalSourceType } from '../../utils/source-utils.js';
import { FORM_ITEM_LAYOUT, FORM_ITEM_LAYOUT_WITHOUT_LABEL, SOURCE_TYPE } from '../../domain/constants.js';

const FormItem = Form.Item;

function AudioWaveformEditor({ content, onContentChanged }) {
  const { t } = useTranslation('audioWaveform');
  const clientConfig = useService(ClientConfig);
  const [isWaveformGeneratorDialogVisible, setIsWaveformGeneratorDialogVisible] = useState(false);

  const { sourceUrl, width } = content;

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    const isNewSourceTypeInternal = isInternalSourceType({ url: newContent.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
    const isInvalid = !isNewSourceTypeInternal && validation.getUrlValidationStatus(newContent.sourceUrl) === URL_VALIDATION_STATUS.error;

    onContentChanged(newContent, isInvalid);
  };

  const handleSourceUrlChange = value => {
    changeContent({ sourceUrl: value });
  };

  const handleGenerateWaveform = () => {
    setIsWaveformGeneratorDialogVisible(true);
  };

  const handleWaveformGeneratorDialogSelect = selectedUrl => {
    setIsWaveformGeneratorDialogVisible(false);
    changeContent({ sourceUrl: getPersistableUrl({ url: selectedUrl, cdnRootUrl: clientConfig.cdnRootUrl }) });
  };

  const handleWaveformGeneratorDialogCancel = () => {
    setIsWaveformGeneratorDialogVisible(false);
  };

  const handleWidthChange = value => {
    changeContent({ width: value });
  };

  const allowedSourceTypes = ensureIsExcluded(Object.values(SOURCE_TYPE), SOURCE_TYPE.youtube);
  const validationProps = isInternalSourceType({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })
    ? {}
    : validation.validateUrl(sourceUrl, t, { allowEmpty: true });

  return (
    <div>
      <Form layout="horizontal">
        <Divider plain>{t('chooseImageDividerText')}</Divider>
        <FormItem {...FORM_ITEM_LAYOUT} {...validationProps} label={t('common:url')}>
          <UrlInput value={sourceUrl} onChange={handleSourceUrlChange} allowedSourceTypes={allowedSourceTypes} />
        </FormItem>
        <Divider plain>{t('generateImageDividerText')}</Divider>
        <FormItem {...FORM_ITEM_LAYOUT_WITHOUT_LABEL}>
          <Button type="primary" onClick={handleGenerateWaveform}>
            {t('generateWaveformFromAudioFile')}
          </Button>
        </FormItem>
        <Divider plain>{t('generalSettingsDividerText')}</Divider>
        <Form.Item
          label={
            <Fragment>
              <Tooltip title={t('common:widthInfo')}>
                <InfoCircleOutlined className="u-info-icon" />
              </Tooltip>
              <span>{t('common:width')}</span>
            </Fragment>
          }
          {...FORM_ITEM_LAYOUT}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthChange} />
        </Form.Item>
      </Form>
      <AudioWaveformGeneratorDialog
        visible={isWaveformGeneratorDialogVisible}
        onSelect={handleWaveformGeneratorDialogSelect}
        onCancel={handleWaveformGeneratorDialogCancel}
        />
    </div>
  );
}

AudioWaveformEditor.propTypes = {
  ...sectionEditorProps
};

export default AudioWaveformEditor;
