import React from 'react';
import TileEditor from './tile-editor.js';
import { useTranslation } from 'react-i18next';
import { IMAGE_TYPE, LINK_TYPE } from '../constants.js';
import { Form, Menu, Radio, Slider, Button, Dropdown } from 'antd';
import { sectionEditorProps } from '../../../ui/default-prop-types.js';
import { swapItemsAt, removeItemAt } from '../../../utils/array-utils.js';
import ObjectMaxWidthSlider from '../../../components/object-max-width-slider.js';
import { confirmDeleteImageTile } from '../../../components/confirmation-dialogs.js';
import { SettingOutlined, PlusOutlined, ArrowUpOutlined, ArrowDownOutlined, DeleteOutlined } from '@ant-design/icons';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

const TILE_MENU_KEY = {
  moveUp: 'move-up',
  moveDown: 'move-down',
  delete: 'delete'
};

const possibleValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const minValue = possibleValues[0];
const maxValue = possibleValues[possibleValues.length - 1];
const marks = possibleValues.reduce((all, val) => {
  const node = <span>{val}</span>;
  return { ...all, [val]: node };
}, {});
const tipFormatter = val => `${val}`;

function ImageTilesEditor({ content, onContentChanged, publicStorage }) {
  const { t } = useTranslation('imageTiles');

  const { tiles, maxWidth, maxTilesPerRow, hoverEffect } = content;

  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 14 }
  };

  const createDefaultTile = () => ({
    image: {
      type: IMAGE_TYPE.external,
      url: ''
    },
    description: '',
    link: {
      type: LINK_TYPE.external,
      url: ''
    }
  });

  const changeContent = newContentValues => {
    onContentChanged({ ...content, ...newContentValues });
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
    const newTiles = content.tiles.slice();
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

  const handleTileMenuClick = ({ item, key }) => {
    const index = item.props['data-index'];
    switch (key) {
      case TILE_MENU_KEY.moveUp:
        moveUpTile(index);
        break;
      case TILE_MENU_KEY.moveDown:
        moveDownTile(index);
        break;
      case TILE_MENU_KEY.delete:
        confirmDeleteImageTile(t, () => deleteTile(index));
        break;
      default:
        break;
    }
  };

  const handleAddButtonClick = () => {
    const newTiles = content.tiles.slice();
    newTiles.push(createDefaultTile());
    changeContent({ tiles: newTiles });
  };

  const renderTileMenu = index => (
    <Menu onClick={handleTileMenuClick}>
      <Menu.Item data-index={index} key={TILE_MENU_KEY.moveUp}>
        <ArrowUpOutlined />&nbsp;&nbsp;<span>{t('common:moveUp')}</span>
      </Menu.Item>
      <Menu.Item data-index={index} key={TILE_MENU_KEY.moveDown}>
        <ArrowDownOutlined />&nbsp;&nbsp;<span>{t('common:moveDown')}</span>
      </Menu.Item>
      <Menu.Item data-index={index} key={TILE_MENU_KEY.delete}>
        <DeleteOutlined style={{ color: 'red' }} />&nbsp;&nbsp;<span>{t('common:delete')}</span>
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
            marks={marks}
            min={minValue}
            max={maxValue}
            value={maxTilesPerRow}
            tipFormatter={tipFormatter}
            onChange={handleMaxTilesPerRowChanged}
            />
        </Form.Item>
        <Form.Item label={t('hoverEffect')} {...formItemLayout}>
          <RadioGroup value={hoverEffect} onChange={handleHoverEffectValueChanged}>
            <RadioButton value="none">{t('noEffect')}</RadioButton>
            <RadioButton value="colorize-zoom">{t('colorAndZoom')}</RadioButton>
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
                    <Button type="ghost" icon={<SettingOutlined />} size="small" />
                  </Dropdown>
                </div>
              </div>
              <div className="Panel-content">
                <TileEditor {...tile} index={index} onChange={handleTileChange} publicStorage={publicStorage} />
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
