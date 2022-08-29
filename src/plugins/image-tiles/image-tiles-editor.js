import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import ImageTileEditor from './image-tile-editor.js';
import ItemPanel from '../../components/item-panel.js';
import { Form, Radio, Slider, Button, Tooltip } from 'antd';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import { InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { swapItemsAt, removeItemAt } from '../../utils/array-utils.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import { HOVER_EFFECT, MAX_ALLOWED_TILES_PER_ROW } from './constants.js';
import { createDefaultTile, isContentInvalid } from './image-tiles-utils.js';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

const maxTilesPerRowPossibleValues = Array.from({ length: MAX_ALLOWED_TILES_PER_ROW }, (_, index) => index + 1);
const maxTilesPerRowMinValue = maxTilesPerRowPossibleValues[0];
const maxTilesPerRowMaxValue = maxTilesPerRowPossibleValues[maxTilesPerRowPossibleValues.length - 1];
const maxTilesPerRowSliderMarks = maxTilesPerRowPossibleValues.reduce((all, val) => {
  const node = <span>{val}</span>;
  return { ...all, [val]: node };
}, {});
const maxTilesPerRowSliderTipFormatter = val => `${val}`;

function ImageTilesEditor({ content, onContentChanged }) {
  const { t } = useTranslation('imageTiles');

  const { tiles, width, maxTilesPerRow, hoverEffect } = content;

  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 14 }
  };

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    const isInvalid = isContentInvalid(newContent, t);
    onContentChanged(newContent, isInvalid);
  };

  const handleWidthValueChanged = value => {
    changeContent({ width: value });
  };

  const handleMaxTilesPerRowChanged = value => {
    changeContent({ maxTilesPerRow: value });
  };

  const handleHoverEffectValueChanged = event => {
    const { value } = event.target;
    changeContent({ hoverEffect: value });
  };

  const handleTileChange = (index, newValues) => {
    const newTiles = tiles.slice();
    newTiles[index] = { ...newTiles[index], ...newValues };
    changeContent({ tiles: newTiles });
  };

  const moveUpTile = index => {
    changeContent({ tiles: swapItemsAt(tiles, index, index - 1) });
  };

  const moveDownTile = index => {
    changeContent({ tiles: swapItemsAt(tiles, index, index + 1) });
  };

  const deleteTile = index => {
    changeContent({ tiles: removeItemAt(tiles, index) });
  };

  const handleAddButtonClick = () => {
    const newTiles = tiles.slice();
    newTiles.push(createDefaultTile(newTiles.length + 1, t));
    changeContent({ tiles: newTiles });
  };

  return (
    <div className="ImageTilesEditor">
      <Form layout="horizontal">
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
          <ObjectWidthSlider value={width} onChange={handleWidthValueChanged} />
        </Form.Item>
        <Form.Item label={t('tilesPerRow')} {...formItemLayout}>
          <Slider
            step={null}
            marks={maxTilesPerRowSliderMarks}
            min={maxTilesPerRowMinValue}
            max={maxTilesPerRowMaxValue}
            value={maxTilesPerRow}
            tipFormatter={maxTilesPerRowSliderTipFormatter}
            onChange={handleMaxTilesPerRowChanged}
            />
        </Form.Item>
        <Form.Item label={t('hoverEffect')} {...formItemLayout}>
          <RadioGroup value={hoverEffect} onChange={handleHoverEffectValueChanged}>
            <RadioButton value={HOVER_EFFECT.none}>{t('hoverEffect_none')}</RadioButton>
            <RadioButton value={HOVER_EFFECT.colorizeZoom}>{t('hoverEffect_colorizeZoom')}</RadioButton>
          </RadioGroup>
        </Form.Item>
        {tiles.map((tile, index) => (
          <ItemPanel
            index={index}
            key={index.toString()}
            itemsCount={tiles.length}
            header={t('tileNumber', { number: index + 1 })}
            onMoveUp={moveUpTile}
            onMoveDown={moveDownTile}
            onDelete={deleteTile}
            >
            <ImageTileEditor
              {...tile}
              index={index}
              onChange={handleTileChange}
              />
          </ItemPanel>
        ))}
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddButtonClick}>
          {t('addTile')}
        </Button>
      </Form>
    </div>
  );
}

ImageTilesEditor.propTypes = {
  ...sectionEditorProps
};

export default ImageTilesEditor;
