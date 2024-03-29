import { Form, Radio, Button } from 'antd';
import Info from '../../components/info.js';
import { useTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import React, { Fragment, useId, useRef } from 'react';
import ItemPanel from '../../components/item-panel.js';
import StepSlider from '../../components/step-slider.js';
import CatalogItemEditor from './catalog-item-editor.js';
import { FORM_ITEM_LAYOUT } from '../../domain/constants.js';
import MarkdownInput from '../../components/markdown-input.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import DragAndDropContainer from '../../components/drag-and-drop-container.js';
import { createDefaultItem, consolidateForDisplayMode } from './catalog-utils.js';
import { TILES_HOVER_EFFECT, MAX_ALLOWED_TILES_PER_ROW, DISPLAY_MODE } from './constants.js';
import { swapItemsAt, removeItemAt, replaceItemAt, moveItem } from '../../utils/array-utils.js';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const FormItem = Form.Item;

function CatalogEditor({ content, onContentChanged }) {
  const droppableIdRef = useRef(useId());
  const { t } = useTranslation('catalog');

  const { title, displayMode, width, items, imageTilesConfig } = content;

  const triggerChange = newContentValues => {
    const newContent = consolidateForDisplayMode({ ...content, ...newContentValues });
    onContentChanged(newContent);
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

  const handleItemMove = (fromIndex, toIndex) => {
    triggerChange({ items: moveItem(items, fromIndex, toIndex) });
  };

  const handleItemDelete = index => {
    triggerChange({ items: removeItemAt(items, index) });
  };

  const handleItemAdd = () => {
    triggerChange({ items: [...items, createDefaultItem()] });
  };

  const dragAndDropPanelItems = items.map((item, index) => ({
    key: item.key,
    render: ({ dragHandleProps, isDragged, isOtherDragged }) => {
      return (
        <ItemPanel
          index={index}
          isDragged={isDragged}
          isOtherDragged={isOtherDragged}
          dragHandleProps={dragHandleProps}
          itemsCount={items.length}
          header={`${t('itemNumber', { number: index + 1 })}${item.title ? ': ' : ''}${item.title}`}
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
      );
    }
  }));

  return (
    <div className="CatalogEditor">
      <Form layout="horizontal" labelAlign="left">
        <FormItem label={t('headline')} {...FORM_ITEM_LAYOUT}>
          <MarkdownInput inline value={title} onChange={handleTitleChange} />
        </FormItem>
        <FormItem
          label={<Info tooltip={t('common:widthInfo')}>{t('common:width')}</Info>}
          {...FORM_ITEM_LAYOUT}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthChange} />
        </FormItem>
        <FormItem label={t('common:displayMode')} {...FORM_ITEM_LAYOUT}>
          <RadioGroup value={displayMode} onChange={handleDisplayModeChange}>
            <RadioButton value={DISPLAY_MODE.linkList}>{t('displayMode_linkList')}</RadioButton>
            <RadioButton value={DISPLAY_MODE.imageTiles}>{t('displayMode_imageTiles')}</RadioButton>
          </RadioGroup>
        </FormItem>
        {displayMode === DISPLAY_MODE.imageTiles && (
          <Fragment>
            <FormItem label={t('tilesPerRow')} {...FORM_ITEM_LAYOUT}>
              <StepSlider
                min={1}
                step={1}
                labelsStep={1}
                max={MAX_ALLOWED_TILES_PER_ROW}
                value={imageTilesConfig.maxTilesPerRow}
                onChange={handleMaxTilesPerRowChange}
                />
            </FormItem>
            <FormItem label={t('hoverEffect')} {...FORM_ITEM_LAYOUT}>
              <RadioGroup value={imageTilesConfig.hoverEffect} onChange={handleHoverEffectChange}>
                <RadioButton value={TILES_HOVER_EFFECT.none}>{t('hoverEffect_none')}</RadioButton>
                <RadioButton value={TILES_HOVER_EFFECT.colorizeZoom}>{t('hoverEffect_colorizeZoom')}</RadioButton>
              </RadioGroup>
            </FormItem>
          </Fragment>
        )}
        <DragAndDropContainer droppableId={droppableIdRef.current} items={dragAndDropPanelItems} onItemMove={handleItemMove} />
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
