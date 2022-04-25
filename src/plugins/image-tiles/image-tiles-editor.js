import React from 'react';
import { useTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import ImageTileEditor from './image-tile-editor.js';
import DeleteButton from '../../components/delete-button.js';
import { Form, Menu, Radio, Slider, Button, Dropdown } from 'antd';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import { swapItemsAt, removeItemAt } from '../../utils/array-utils.js';
import MoveUpIcon from '../../components/icons/general/move-up-icon.js';
import { HOVER_EFFECT, MAX_ALLOWED_TILES_PER_ROW } from './constants.js';
import MoveDownIcon from '../../components/icons/general/move-down-icon.js';
import SettingsIcon from '../../components/icons/main-menu/settings-icon.js';
import { createDefaultTile, isContentInvalid } from './image-tiles-utils.js';
import ObjectMaxWidthSlider from '../../components/object-max-width-slider.js';
import { confirmDeleteImageTile } from '../../components/confirmation-dialogs.js';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

const maxTilesPerRowPossibleValues = [...new Array(MAX_ALLOWED_TILES_PER_ROW).keys()].map(index => index + 1);
const maxTilesPerRowMinValue = maxTilesPerRowPossibleValues[0];
const maxTilesPerRowMaxValue = maxTilesPerRowPossibleValues[maxTilesPerRowPossibleValues.length - 1];
const maxTilesPerRowSliderMarks = maxTilesPerRowPossibleValues.reduce((all, val) => {
  const node = <span>{val}</span>;
  return { ...all, [val]: node };
}, {});
const maxTilesPerRowSliderTipFormatter = val => `${val}`;

function ImageTilesEditor({ content, onContentChanged, publicStorage, privateStorage }) {
  const { t } = useTranslation('imageTiles');

  const { tiles, maxWidth, maxTilesPerRow, hoverEffect } = content;

  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 14 }
  };

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    const isInvalid = isContentInvalid(newContent, t);
    onContentChanged(newContent, isInvalid);
  };

  const handleMaxWidthValueChanged = value => {
    changeContent({ maxWidth: value });
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

  const handleMoveUpClick = index => moveUpTile(index);
  const handleMoveDownClick = index => moveDownTile(index);
  const handleDeleteClick = index => confirmDeleteImageTile(t, () => deleteTile(index));

  const handleAddButtonClick = () => {
    const newTiles = tiles.slice();
    newTiles.push(createDefaultTile(newTiles.length + 1, t));
    changeContent({ tiles: newTiles });
  };

  const renderTileMenu = index => (
    <Menu>
      <Menu.Item key="moveUp" onClick={() => handleMoveUpClick(index)}>
        <Button type="link" size="small" icon={<MoveUpIcon />}>{t('common:moveUp')}</Button>
      </Menu.Item>
      <Menu.Item key="moveDown" onClick={() => handleMoveDownClick(index)}>
        <Button type="link" size="small" icon={<MoveDownIcon />}>{t('common:moveDown')}</Button>
      </Menu.Item>
      <Menu.Item key="delete" >
        <DeleteButton onClick={() => handleDeleteClick(index)}>{t('common:delete')}</DeleteButton>
      </Menu.Item>
    </Menu>
  );

  return (
    <div>
      <Form layout="horizontal">
        <Form.Item label={t('maximumWidth')} {...formItemLayout}>
          <ObjectMaxWidthSlider value={maxWidth} onChange={handleMaxWidthValueChanged} />
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
          <div key={index.toString()} style={{ marginBottom: '10px' }}>
            <div className="Panel">
              <div className="Panel-header" style={{ display: 'flex' }}>
                <div style={{ flex: '1 0 0%' }}>
                  {t('tileNumber', { number: index + 1 })}
                </div>
                <div style={{ flex: 'none' }}>
                  <Dropdown overlay={renderTileMenu(index)} placement="bottomRight">
                    <Button type="ghost" icon={<SettingsIcon />} size="small" />
                  </Dropdown>
                </div>
              </div>
              <div className="Panel-content">
                <ImageTileEditor
                  {...tile}
                  index={index}
                  onChange={handleTileChange}
                  publicStorage={publicStorage}
                  privateStorage={privateStorage}
                  />
              </div>
            </div>
          </div>
        ))}
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddButtonClick}>{t('addTile')}</Button>
      </Form>
    </div>
  );
}

ImageTilesEditor.propTypes = {
  ...sectionEditorProps
};

export default ImageTilesEditor;
