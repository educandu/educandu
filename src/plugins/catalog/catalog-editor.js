import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import ItemPanel from '../../components/item-panel.js';
import CatalogItemEditor from './catalog-item-editor.js';
import { Form, Radio, Slider, Button, Tooltip } from 'antd';
import ClientConfig from '../../bootstrap/client-config.js';
import MarkdownInput from '../../components/markdown-input.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import { InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import { swapItemsAt, removeItemAt, replaceItemAt } from '../../utils/array-utils.js';
import { TILES_HOVER_EFFECT, MAX_ALLOWED_TILES_PER_ROW, DISPLAY_MODE } from './constants.js';
import { createDefaultItem, consolidateForDisplayMode, isContentInvalid } from './catalog-utils.js';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const FormItem = Form.Item;

const maxTilesPerRowPossibleValues = Array.from({ length: MAX_ALLOWED_TILES_PER_ROW }, (_, index) => index + 1);
const maxTilesPerRowMinValue = maxTilesPerRowPossibleValues[0];
const maxTilesPerRowMaxValue = maxTilesPerRowPossibleValues[maxTilesPerRowPossibleValues.length - 1];
const maxTilesPerRowSliderMarks = maxTilesPerRowPossibleValues.reduce((all, val) => {
  const node = <span>{val}</span>;
  return { ...all, [val]: node };
}, {});
const maxTilesPerRowSliderTipFormatter = val => `${val}`;

const formItemLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 14 }
};

function CatalogEditor({ content, onContentChanged }) {
  const { t } = useTranslation('catalog');
  const clientConfig = useService(ClientConfig);

  const { title, displayMode, width, items, imageTilesConfig } = content;

  const triggerChange = newContentValues => {
    const newContent = consolidateForDisplayMode({ ...content, ...newContentValues });
    const isInvalid = isContentInvalid(newContent, clientConfig.cdnRootUrl);
    onContentChanged(newContent, isInvalid);
  };

  const handleTitleChange = event => {
    triggerChange({ title: event.target.value });
  };

  const handleWidthChange = value => {
    triggerChange({ width: value });
  };

  const handleDisplayModeChange = event => {
    triggerChange({ displayMode: event.target.value });
  };

  const handleMaxTilesPerRowChange = value => {
    triggerChange({ imageTilesConfig: { ...imageTilesConfig, maxTilesPerRow: value } });
  };

  const handleHoverEffectChange = event => {
    triggerChange({ imageTilesConfig: { ...imageTilesConfig, hoverEffect: event.target.value } });
  };

  const handleItemChange = (index, newValues) => {
    triggerChange({ items: replaceItemAt(items, { ...items[index], ...newValues }, index) });
  };

  const handleItemMoveUp = index => {
    triggerChange({ items: swapItemsAt(items, index, index - 1) });
  };

  const handleItemMoveDown = index => {
    triggerChange({ items: swapItemsAt(items, index, index + 1) });
  };

  const handleItemDelete = index => {
    triggerChange({ items: removeItemAt(items, index) });
  };

  const handleItemAdd = () => {
    triggerChange({ items: [...items, createDefaultItem(items.length, t)] });
  };

  return (
    <div className="CatalogEditor">
      <Form layout="horizontal">
        <FormItem label={t('common:title')} {...formItemLayout}>
          <MarkdownInput inline value={title} onChange={handleTitleChange} />
        </FormItem>
        <FormItem
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
        </FormItem>
        <FormItem label={t('displayMode')} {...formItemLayout}>
          <RadioGroup value={displayMode} onChange={handleDisplayModeChange}>
            <RadioButton value={DISPLAY_MODE.linkList}>{t('displayMode_linkList')}</RadioButton>
            <RadioButton value={DISPLAY_MODE.imageTiles}>{t('displayMode_imageTiles')}</RadioButton>
          </RadioGroup>
        </FormItem>
        {displayMode === DISPLAY_MODE.imageTiles && (
          <Fragment>
            <FormItem label={t('tilesPerRow')} {...formItemLayout}>
              <Slider
                step={null}
                marks={maxTilesPerRowSliderMarks}
                min={maxTilesPerRowMinValue}
                max={maxTilesPerRowMaxValue}
                value={imageTilesConfig.maxTilesPerRow}
                tipFormatter={maxTilesPerRowSliderTipFormatter}
                onChange={handleMaxTilesPerRowChange}
                />
            </FormItem>
            <FormItem label={t('hoverEffect')} {...formItemLayout}>
              <RadioGroup value={imageTilesConfig.hoverEffect} onChange={handleHoverEffectChange}>
                <RadioButton value={TILES_HOVER_EFFECT.none}>{t('hoverEffect_none')}</RadioButton>
                <RadioButton value={TILES_HOVER_EFFECT.colorizeZoom}>{t('hoverEffect_colorizeZoom')}</RadioButton>
              </RadioGroup>
            </FormItem>
          </Fragment>
        )}
        {items.map((item, index) => (
          <ItemPanel
            index={index}
            key={index.toString()}
            itemsCount={items.length}
            header={t('itemNumber', { number: index + 1 })}
            onMoveUp={handleItemMoveUp}
            onMoveDown={handleItemMoveDown}
            onDelete={handleItemDelete}
            >
            <CatalogItemEditor
              item={item}
              enableImageEditing={displayMode === DISPLAY_MODE.imageTiles}
              onChange={newItem => handleItemChange(index, newItem)}
              />
          </ItemPanel>
        ))}
        <Button type="primary" icon={<PlusOutlined />} onClick={handleItemAdd}>
          {t('addItem')}
        </Button>
      </Form>
    </div>
  );
}

CatalogEditor.propTypes = {
  ...sectionEditorProps
};

export default CatalogEditor;
