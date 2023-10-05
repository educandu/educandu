import { Button, Form, Radio } from 'antd';
import Info from '../../components/info.js';
import React, { useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import ItemPanel from '../../components/item-panel.js';
import StepSlider from '../../components/step-slider.js';
import { createDefaultItem } from './select-field-utils.js';
import { FORM_ITEM_LAYOUT } from '../../domain/constants.js';
import MarkdownInput from '../../components/markdown-input.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import { MAXIMUM_MAX_COLUMNS_VALUE, SELECT_FIELD_MODE } from './constants.js';
import DragAndDropContainer from '../../components/drag-and-drop-container.js';
import { swapItemsAt, removeItemAt, replaceItemAt, moveItem } from '../../utils/array-utils.js';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const FormItem = Form.Item;

export default function SelectFieldEditor({ content, onContentChanged }) {
  const droppableIdRef = useRef(useId());
  const { t } = useTranslation('selectField');
  const { mode, label, maxColumns, width, items } = content;

  const updateContent = newContentValues => {
    onContentChanged({ ...content, ...newContentValues });
  };

  const handleModeChange = event => {
    updateContent({ mode: event.target.value });
  };

  const handleLabelChange = event => {
    updateContent({ label: event.target.value });
  };

  const handleMaxColumnsChange = value => {
    updateContent({ maxColumns: value });
  };

  const handleWidthChange = value => {
    updateContent({ width: value });
  };

  const handleItemChange = (index, newValues) => {
    updateContent({ items: replaceItemAt(items, { ...items[index], ...newValues }, index) });
  };

  const handleItemMoveUp = index => {
    updateContent({ items: swapItemsAt(items, index, index - 1) });
  };

  const handleItemMoveDown = index => {
    updateContent({ items: swapItemsAt(items, index, index + 1) });
  };

  const handleItemMove = (fromIndex, toIndex) => {
    updateContent({ items: moveItem(items, fromIndex, toIndex) });
  };

  const handleItemDelete = index => {
    updateContent({ items: removeItemAt(items, index) });
  };

  const handleItemAdd = () => {
    updateContent({ items: [...items, createDefaultItem()] });
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
          header={`${t('itemNumber', { number: index + 1 })}${item.text ? ': ' : ''}${item.text}`}
          onMoveUp={handleItemMoveUp}
          onMoveDown={handleItemMoveDown}
          onDelete={handleItemDelete}
          >
          <FormItem label={t('common:label')} {...FORM_ITEM_LAYOUT}>
            <MarkdownInput inline value={item.text} onChange={event => handleItemChange(index, { text: event.target.value })} />
          </FormItem>
        </ItemPanel>
      );
    }
  }));

  return (
    <div>
      <Form labelAlign="left">
        <FormItem label={t('mode')} {...FORM_ITEM_LAYOUT}>
          <RadioGroup value={mode} onChange={handleModeChange}>
            <RadioButton value={SELECT_FIELD_MODE.singleSelection}>{t('mode_singleSelection')}</RadioButton>
            <RadioButton value={SELECT_FIELD_MODE.multiSelection}>{t('mode_multiSelection')}</RadioButton>
          </RadioGroup>
        </FormItem>
        <FormItem label={t('common:label')} {...FORM_ITEM_LAYOUT}>
          <MarkdownInput inline value={label} onChange={handleLabelChange} />
        </FormItem>
        <FormItem
          label={<Info tooltip={t('common:widthInfo')}>{t('maxColumns')}</Info>}
          {...FORM_ITEM_LAYOUT}
          >
          <StepSlider
            min={1}
            step={1}
            labelsStep={1}
            max={MAXIMUM_MAX_COLUMNS_VALUE}
            value={maxColumns}
            onChange={handleMaxColumnsChange}
            />
        </FormItem>
        <FormItem
          label={<Info tooltip={t('common:widthInfo')}>{t('common:width')}</Info>}
          {...FORM_ITEM_LAYOUT}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthChange} />
        </FormItem>
        <DragAndDropContainer droppableId={droppableIdRef.current} items={dragAndDropPanelItems} onItemMove={handleItemMove} />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleItemAdd}>
          {t('addItem')}
        </Button>
      </Form>
    </div>
  );
}

SelectFieldEditor.propTypes = {
  ...sectionEditorProps
};
