import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { range } from '../../utils/array-utils.js';
import { Form, Input, Slider, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { CDN_URL_PREFIX } from '../../domain/constants.js';
import MarkdownInput from '../../components/markdown-input.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import { MAX_ZOOM_VALUE, MIN_ZOOM_VALUE, SOURCE_TYPE } from './constants.js';
import ResourcePicker from '../../components/resource-picker/resource-picker.js';
import { storageLocationPathToUrl, urlToStorageLocationPath } from '../../utils/storage-utils.js';

const FormItem = Form.Item;

const formItemLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 14 }
};

const possibleZoomSliderValues = range({ from: MIN_ZOOM_VALUE * 100, to: MAX_ZOOM_VALUE * 100, step: 5 });

const zoomSliderMarks = possibleZoomSliderValues.reduce((all, val) => {
  const markLabel = val % 25 === 0 ? `${val}%` : '';
  const node = <span>{markLabel}</span>;
  return { ...all, [val]: node };
}, {});

const zoomTipFormatter = val => `${val}%`;

function MusicXmlViewerEditor({ content, onContentChanged }) {
  const { t } = useTranslation('musicXmlViewer');

  const { sourceUrl, zoom, width, caption } = content;

  const triggerContentChanged = newContentValues => {
    onContentChanged({ ...content, ...newContentValues }, false);
  };

  const handleSourceUrlChange = event => {
    triggerContentChanged({ sourceType: SOURCE_TYPE.internal, sourceUrl: event.target.value });
  };

  const handleCdnFileNameChange = newValue => {
    triggerContentChanged({ sourceType: SOURCE_TYPE.internal, sourceUrl: newValue });
  };

  const handleZoomChange = newValue => {
    triggerContentChanged({ zoom: newValue / 100 });
  };

  const handleWidthChange = newValue => {
    triggerContentChanged({ width: newValue });
  };

  const handleCaptionChange = event => {
    triggerContentChanged({ caption: event.target.value });
  };

  return (
    <div className="MusicXmlViewerEditor">
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
        <Form.Item label={t('zoom')} {...formItemLayout}>
          <Slider
            min={MIN_ZOOM_VALUE * 100}
            max={MAX_ZOOM_VALUE * 100}
            marks={zoomSliderMarks}
            step={5}
            value={zoom * 100}
            onChange={handleZoomChange}
            tipFormatter={zoomTipFormatter}
            />
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

MusicXmlViewerEditor.propTypes = {
  ...sectionEditorProps
};

export default MusicXmlViewerEditor;
