import React from 'react';
import { useTranslation } from 'react-i18next';
import validation from '../../../ui/validation.js';
import { InfoCircleOutlined } from '@ant-design/icons';
import { RENDER_MODE, SOURCE_TYPE } from '../constants.js';
import { Form, Input, Radio, Switch, Tooltip } from 'antd';
import ClientConfig from '../../../bootstrap/client-config.js';
import { useService } from '../../../components/container-context.js';
import { sectionEditorProps } from '../../../ui/default-prop-types.js';
import StorageFilePicker from '../../../components/storage-file-picker.js';
import ObjectMaxWidthSlider from '../../../components/object-max-width-slider.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

const formItemLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 14 }
};

function PdfViewerEditor({ content, onContentChanged, publicStorage, privateStorage }) {
  const { t } = useTranslation('pdfViewer');
  const clientConfig = useService(ClientConfig);

  const { sourceType, sourceUrl, renderMode, showTextOverlay, width, caption } = content;

  const triggerContentChanged = newContentValues => {
    onContentChanged({ ...content, ...newContentValues });
  };

  const handleSourceUrlChange = event => {
    triggerContentChanged({ sourceUrl: event.target.value });
  };

  const handleCdnFileNameChange = value => {
    triggerContentChanged({ sourceUrl: value });
  };

  const handleSourceTypeChange = event => {
    triggerContentChanged({ sourceType: event.target.value, sourceUrl: '' });
  };

  const handleRenderModeChange = event => {
    triggerContentChanged({ renderMode: event.target.value });
  };

  const handleShowTextOverlayChange = newShowTextOverlay => {
    triggerContentChanged({ showTextOverlay: newShowTextOverlay });
  };
  const handleWidthChange = newValue => {
    triggerContentChanged({ width: newValue });
  };

  const handleCaptionChange = event => {
    triggerContentChanged({ caption: event.target.value });
  };

  return (
    <div className="PdfViewerEditor">
      <Form layout="horizontal">
        <FormItem label={t('source')} {...formItemLayout}>
          <RadioGroup value={sourceType} onChange={handleSourceTypeChange}>
            <RadioButton value={SOURCE_TYPE.external}>{t('externalLink')}</RadioButton>
            <RadioButton value={SOURCE_TYPE.internal}>{t('internalLink')}</RadioButton>
          </RadioGroup>
        </FormItem>
        {sourceType === SOURCE_TYPE.external && (
          <FormItem label={t('externalUrl')} {...formItemLayout} {...validation.validateUrl(sourceUrl, t)} hasFeedback>
            <Input value={sourceUrl} onChange={handleSourceUrlChange} />
          </FormItem>
        )}
        {sourceType === SOURCE_TYPE.internal && (
          <FormItem label={t('internalUrl')} {...formItemLayout}>
            <div className="PdfViewerEditor-internalSourceSelector">
              <Input
                addonBefore={`${clientConfig.cdnRootUrl}/`}
                value={sourceUrl}
                onChange={handleSourceUrlChange}
                />
              <StorageFilePicker
                publicStorage={publicStorage}
                privateStorage={privateStorage}
                fileName={sourceUrl}
                onFileNameChanged={handleCdnFileNameChange}
                />
            </div>
          </FormItem>
        )}
        <Form.Item label={t('renderMode')} {...formItemLayout}>
          <RadioGroup value={renderMode} onChange={handleRenderModeChange}>
            <RadioButton value={RENDER_MODE.svg}>SVG</RadioButton>
            <RadioButton value={RENDER_MODE.canvas}>Canvas</RadioButton>
          </RadioGroup>
          <Tooltip title={t('renderModeInfo')}>
            <InfoCircleOutlined className="PdfViewerEditor-infoIcon" />
          </Tooltip>
        </Form.Item>
        <Form.Item label={t('showTextOverlay')} {...formItemLayout}>
          <Switch size="small" checked={showTextOverlay} onChange={handleShowTextOverlayChange} />
          <Tooltip title={t('showTextOverlayInfo')}>
            <InfoCircleOutlined className="PdfViewerEditor-infoIcon" />
          </Tooltip>
        </Form.Item>
        <Form.Item label={t('width')} {...formItemLayout}>
          <ObjectMaxWidthSlider defaultValue={100} value={width} onChange={handleWidthChange} />
        </Form.Item>
        <Form.Item label={t('caption')} {...formItemLayout}>
          <Input defaultValue={100} value={caption} onChange={handleCaptionChange} />
        </Form.Item>
      </Form>
    </div>
  );
}

PdfViewerEditor.propTypes = {
  ...sectionEditorProps
};

export default PdfViewerEditor;
