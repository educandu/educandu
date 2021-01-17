import React from 'react';
import autoBind from 'auto-bind';
import TileEditor from './tile-editor';
import { withTranslation } from 'react-i18next';
import { Form, Menu, Radio, Slider, Button, Dropdown, Modal } from 'antd';
import { swapItems, removeItem } from '../../../utils/immutable-array-utils';
import ObjectMaxWidthSlider from '../../../components/object-max-width-slider';
import { sectionEditorProps, translationProps } from '../../../ui/default-prop-types';
import { SettingOutlined, PlusOutlined, ArrowUpOutlined, ArrowDownOutlined, DeleteOutlined } from '@ant-design/icons';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const { confirm } = Modal;

const TILE_MENU_KEY_MOVE_UP = 'move-up';
const TILE_MENU_KEY_MOVE_DOWN = 'move-down';
const TILE_MENU_KEY_DELETE = 'delete';

const possibleValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const minValue = possibleValues[0];
const maxValue = possibleValues[possibleValues.length - 1];
const marks = possibleValues.reduce((all, val) => {
  const node = <span>{val}</span>;
  return { ...all, [val]: node };
}, {});
const tipFormatter = val => `${val}`;

class ImageTilesEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
  }

  createDefaultTile() {
    return {
      image: {
        type: 'external',
        url: ''
      },
      description: '',
      link: {
        type: 'external',
        url: ''
      }
    };
  }

  handleMaxWidthValueChanged(value) {
    this.changeContent({ maxWidth: value });
  }

  handleCurrentEditorValueChanged(event) {
    const newValue = event.target.value;
    this.changeContent({ text: newValue });
  }

  handleMaxTilesPerRowChanged(value) {
    this.changeContent({ maxTilesPerRow: value });
  }

  handleHoverEffectValueChanged(event) {
    const { value } = event.target;
    this.changeContent({ hoverEffect: value });
  }

  handleTileChange(index, newValues) {
    const newTiles = this.props.content.tiles.slice();
    newTiles[index] = { ...newTiles[index], ...newValues };
    this.changeContent({ tiles: newTiles });
  }

  handleTileMenuClick({ item, key }) {
    const index = item.props['data-index'];
    switch (key) {
      case TILE_MENU_KEY_MOVE_UP:
        this.moveUpTile(index);
        break;
      case TILE_MENU_KEY_MOVE_DOWN:
        this.moveDownTile(index);
        break;
      case TILE_MENU_KEY_DELETE:
        this.confirmDelete(() => this.deleteTile(index));
        break;
      default:
        break;
    }
  }

  handleAddButtonClick() {
    const newTiles = this.props.content.tiles.slice();
    newTiles.push(this.createDefaultTile());
    this.changeContent({ tiles: newTiles });
  }

  moveUpTile(index) {
    const { tiles } = this.props.content;
    this.changeContent({ tiles: swapItems(tiles, index, index - 1) });
  }

  moveDownTile(index) {
    const { tiles } = this.props.content;
    this.changeContent({ tiles: swapItems(tiles, index, index + 1) });
  }

  deleteTile(index) {
    const { tiles } = this.props.content;
    this.changeContent({ tiles: removeItem(tiles, index) });
  }

  confirmDelete(onOk, onCancel = () => {}) {
    confirm({
      title: 'Sind Sie sicher?',
      content: 'Möchten Sie diese Kachel löschen?',
      okText: 'Ja',
      okType: 'danger',
      cancelText: 'Nein',
      onOk: onOk,
      onCancel: onCancel
    });
  }

  changeContent(newContentValues) {
    const { content, onContentChanged } = this.props;
    onContentChanged({ ...content, ...newContentValues });
  }

  createTileMenu(index) {
    const { t } = this.props;
    return (
      <Menu onClick={this.handleTileMenuClick}>
        <Menu.Item data-index={index} key={TILE_MENU_KEY_MOVE_UP}>
          <ArrowUpOutlined />&nbsp;&nbsp;<span>{t('common:moveUp')}</span>
        </Menu.Item>
        <Menu.Item data-index={index} key={TILE_MENU_KEY_MOVE_DOWN}>
          <ArrowDownOutlined />&nbsp;&nbsp;<span>{t('common:moveDown')}</span>
        </Menu.Item>
        <Menu.Item data-index={index} key={TILE_MENU_KEY_DELETE}>
          <DeleteOutlined style={{ color: 'red' }} />&nbsp;&nbsp;<span>{t('common:delete')}</span>
        </Menu.Item>
      </Menu>
    );
  }

  render() {
    const { docKey, content, t } = this.props;
    const { tiles, maxWidth, maxTilesPerRow, hoverEffect } = content;

    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 14 }
    };

    return (
      <div>
        <Form layout="horizontal">
          <Form.Item label={t('maximumWidth')} {...formItemLayout}>
            <ObjectMaxWidthSlider value={maxWidth} onChange={this.handleMaxWidthValueChanged} />
          </Form.Item>
          <Form.Item label={t('tilesPerRow')} {...formItemLayout}>
            <Slider
              step={null}
              marks={marks}
              min={minValue}
              max={maxValue}
              value={maxTilesPerRow}
              tipFormatter={tipFormatter}
              onChange={this.handleMaxTilesPerRowChanged}
              />
          </Form.Item>
          <Form.Item label={t('hoverEffect')} {...formItemLayout}>
            <RadioGroup value={hoverEffect} onChange={this.handleHoverEffectValueChanged}>
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
                    <Dropdown overlay={this.createTileMenu(index)} placement="bottomRight">
                      <Button type="ghost" icon={<SettingOutlined />} size="small" />
                    </Dropdown>
                  </div>
                </div>
                <div className="Panel-content">
                  <TileEditor {...tile} index={index} onChange={this.handleTileChange} docKey={docKey} />
                </div>
              </div>
            </div>
          ))}
          <Button type="primary" icon={<PlusOutlined />} onClick={this.handleAddButtonClick}>{t('addTile')}</Button>
        </Form>
      </div>
    );
  }
}

ImageTilesEditor.propTypes = {
  ...translationProps,
  ...sectionEditorProps
};

export default withTranslation('imageTiles')(ImageTilesEditor);
