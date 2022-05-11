import React from 'react';
import { SOURCE_TYPE } from './constants.js';
import { useTranslation } from 'react-i18next';
import { InfoCircleOutlined } from '@ant-design/icons';
import ClientConfig from '../../bootstrap/client-config.js';
import { Form, Input, InputNumber, Switch, Tooltip } from 'antd';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import StorageFilePicker from '../../components/storage-file-picker.js';
import ObjectMaxWidthSlider from '../../components/object-max-width-slider.js';

const FormItem = Form.Item;

const formItemLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 14 }
};

function PdfViewerEditor({ content, onContentChanged, publicStorage, privateStorage }) {
  const { t } = useTranslation('pdfViewer');
  const clientConfig = useService(ClientConfig);

  const { sourceUrl, initialPageNumber, showTextOverlay, width, caption } = content;

  const triggerContentChanged = newContentValues => {
    onContentChanged({ ...content, ...newContentValues }, false);
  };

  const handleSourceUrlChange = event => {
    triggerContentChanged({ sourceType: SOURCE_TYPE.internal, sourceUrl: event.target.value, initialPageNumber: 1 });
  };

  const handleCdnFileNameChange = newValue => {
    triggerContentChanged({ sourceType: SOURCE_TYPE.internal, sourceUrl: newValue, initialPageNumber: 1 });
  };

  const handleInitialPageNumberChange = newInitialPageNumber => {
    triggerContentChanged({ initialPageNumber: newInitialPageNumber });
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
        <FormItem label={t('common:internalUrl')} {...formItemLayout}>
          <div className="u-input-and-button">
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
        <Form.Item label={t('initialPageNumber')} {...formItemLayout}>
          <InputNumber min={1} step={1} value={initialPageNumber} onChange={handleInitialPageNumberChange} />
        </Form.Item>
        <Form.Item label={t('showTextOverlay')} {...formItemLayout}>
          <Switch size="small" checked={showTextOverlay} onChange={handleShowTextOverlayChange} />
          <Tooltip title={t('showTextOverlayInfo')}>
            <InfoCircleOutlined className="PdfViewerEditor-infoIcon" />
          </Tooltip>
        </Form.Item>
        <Form.Item label={t('common:width')} {...formItemLayout}>
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
