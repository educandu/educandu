import React, { Fragment } from 'react';
import { SOURCE_TYPE } from './constants.js';
import { useTranslation } from 'react-i18next';
import { InfoCircleOutlined } from '@ant-design/icons';
import { CDN_URL_PREFIX } from '../../domain/constants.js';
import MarkdownInput from '../../components/markdown-input.js';
import { Form, Input, InputNumber, Switch, Tooltip } from 'antd';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import ResourcePicker from '../../components/resource-picker/resource-picker.js';
import { storageLocationPathToUrl, urlToStorageLocationPath } from '../../utils/storage-utils.js';

const FormItem = Form.Item;

const formItemLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 14 }
};

function PdfViewerEditor({ content, onContentChanged }) {
  const { t } = useTranslation('pdfViewer');

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
              addonBefore={CDN_URL_PREFIX}
              value={sourceUrl}
              onChange={handleSourceUrlChange}
              />
            <ResourcePicker
              url={storageLocationPathToUrl(sourceUrl)}
              onUrlChange={url => handleCdnFileNameChange(urlToStorageLocationPath(url))}
              />
          </div>
        </FormItem>
        <Form.Item label={t('initialPageNumber')} {...formItemLayout}>
          <InputNumber min={1} step={1} value={initialPageNumber} onChange={handleInitialPageNumberChange} />
        </Form.Item>
        <Form.Item
          label={
            <Fragment>
              <Tooltip title={t('showTextOverlayInfo')}>
                <InfoCircleOutlined className="u-info-icon" />
              </Tooltip>
              <span>{t('showTextOverlay')}</span>
            </Fragment>
          }
          {...formItemLayout}
          >
          <Switch size="small" checked={showTextOverlay} onChange={handleShowTextOverlayChange} />
        </Form.Item>
        <Form.Item
          label={
            <Fragment>
              <Tooltip title={t('common:widthInfo')}>
                <InfoCircleOutlined className="u-info-icon" />
              </Tooltip>
              <span>{t('common:width')}</span>
            </Fragment>
          }
          {...formItemLayout}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthChange} />
        </Form.Item>
        <Form.Item label={t('common:caption')} {...formItemLayout}>
          <MarkdownInput inline value={caption} onChange={handleCaptionChange} />
        </Form.Item>
      </Form>
    </div>
  );
}

PdfViewerEditor.propTypes = {
  ...sectionEditorProps
};

export default PdfViewerEditor;
