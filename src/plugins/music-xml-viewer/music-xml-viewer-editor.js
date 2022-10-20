import React, { Fragment } from 'react';
import { Form, Slider, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { range } from '../../utils/array-utils.js';
import UrlInput from '../../components/url-input.js';
import { InfoCircleOutlined } from '@ant-design/icons';
import MarkdownInput from '../../components/markdown-input.js';
import { MAX_ZOOM_VALUE, MIN_ZOOM_VALUE } from './constants.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import { FORM_ITEM_LAYOUT, SOURCE_TYPE } from '../../domain/constants.js';

const FormItem = Form.Item;

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

  const handleSourceUrlChange = value => {
    triggerContentChanged({ sourceUrl: value });
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

  const allowedSourceTypes = [SOURCE_TYPE.none, SOURCE_TYPE.internalPrivate, SOURCE_TYPE.internalPublic];

  return (
    <div className="MusicXmlViewerEditor">
      <Form layout="horizontal">
        <FormItem {...FORM_ITEM_LAYOUT} label={t('common:url')}>
          <UrlInput value={sourceUrl} onChange={handleSourceUrlChange} allowedSourceTypes={allowedSourceTypes} />
        </FormItem>
        <Form.Item label={t('zoom')} {...FORM_ITEM_LAYOUT}>
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
          {...FORM_ITEM_LAYOUT}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthChange} />
        </Form.Item>
        <Form.Item label={t('common:caption')} {...FORM_ITEM_LAYOUT}>
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
