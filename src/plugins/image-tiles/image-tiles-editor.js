import React from 'react';
import { useTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import ImageTileEditor from './image-tile-editor.js';
import { Form, Menu, Radio, Slider, Button, Dropdown } from 'antd';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import DeleteIcon from '../../components/icons/general/delete-icon.js';
import { swapItemsAt, removeItemAt } from '../../utils/array-utils.js';
import MoveUpIcon from '../../components/icons/general/move-up-icon.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import { HOVER_EFFECT, MAX_ALLOWED_TILES_PER_ROW } from './constants.js';
import MoveDownIcon from '../../components/icons/general/move-down-icon.js';
import SettingsIcon from '../../components/icons/main-menu/settings-icon.js';
import { createDefaultTile, isContentInvalid } from './image-tiles-utils.js';
import { confirmDeleteImageTile } from '../../components/confirmation-dialogs.js';

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

  const renderTileMenu = index => {
    const handleTileMenuClick = ({ key }) => {
      switch (key) {
        case 'moveUp':
          return moveUpTile(index);
        case 'moveDown':
          return moveDownTile(index);
        case 'delete':
          return confirmDeleteImageTile(t, () => deleteTile(index));
        default:
          throw new Error(`Unknown key: ${key}`);
      }
    };

    const items = [
      {
        key: 'moveUp',
        label: t('common:moveUp'),
        icon: <MoveUpIcon className="u-dropdown-icon" />
      },
      {
        key: 'moveDown',
        label: t('common:moveDown'),
        icon: <MoveDownIcon className="u-dropdown-icon" />
      },
      {
        key: 'delete',
        label: t('common:delete'),
        icon: <DeleteIcon className="u-dropdown-icon" />,
        danger: true
      }
    ];

    return <Menu items={items} onClick={handleTileMenuClick} />;
  };

  return (
    <div>
      <Form layout="horizontal">
        <Form.Item label={t('common:width')} {...formItemLayout}>
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
