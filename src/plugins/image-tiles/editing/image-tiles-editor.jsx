const React = require('react');
const autoBind = require('auto-bind');
const TileEditor = require('./tile-editor.jsx');
const { sectionEditorProps } = require('../../../ui/default-prop-types');
const { Form, Menu, Radio, Slider, Button, Dropdown, Modal } = require('antd');
const { swapItems, removeItem } = require('../../../utils/immutable-array-utils');
const ObjectMaxWidthSlider = require('../../../components/object-max-width-slider.jsx');
const { SettingOutlined, PlusOutlined, ArrowUpOutlined, ArrowDownOutlined, DeleteOutlined } = require('@ant-design/icons');

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
    return (
      <Menu onClick={this.handleTileMenuClick}>
        <Menu.Item data-index={index} key={TILE_MENU_KEY_MOVE_UP}>
          <ArrowUpOutlined />&nbsp;&nbsp;<span>Nach oben verschieben</span>
        </Menu.Item>
        <Menu.Item data-index={index} key={TILE_MENU_KEY_MOVE_DOWN}>
          <ArrowDownOutlined />&nbsp;&nbsp;<span>Nach unten verschieben</span>
        </Menu.Item>
        <Menu.Item data-index={index} key={TILE_MENU_KEY_DELETE}>
          <DeleteOutlined style={{ color: 'red' }} />&nbsp;&nbsp;<span>Löschen</span>
        </Menu.Item>
      </Menu>
    );
  }

  render() {
    const { docKey, content } = this.props;
    const { tiles, maxWidth, maxTilesPerRow, hoverEffect } = content;

    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 14 }
    };

    return (
      <div>
        <Form layout="horizontal">
          <Form.Item label="Maximale Breite" {...formItemLayout}>
            <ObjectMaxWidthSlider value={maxWidth} onChange={this.handleMaxWidthValueChanged} />
          </Form.Item>
          <Form.Item label="Kacheln pro Zeile" {...formItemLayout}>
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
          <Form.Item label="Hovereffekt" {...formItemLayout}>
            <RadioGroup value={hoverEffect} onChange={this.handleHoverEffectValueChanged}>
              <RadioButton value="none">kein Effekt</RadioButton>
              <RadioButton value="colorize-zoom">Färben und Zoomen</RadioButton>
            </RadioGroup>
          </Form.Item>
          {tiles.map((tile, index) => (
            <div key={index.toString()} style={{ marginBottom: '10px' }}>
              <div className="Panel">
                <div className="Panel-header" style={{ display: 'flex' }}>
                  <div style={{ flex: '1 0 0%' }}>
                    Kachel {index + 1}
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
          <Button type="primary" icon={<PlusOutlined />} onClick={this.handleAddButtonClick}>Kachel hinzufügen</Button>
        </Form>
      </div>
    );
  }
}

ImageTilesEditor.propTypes = {
  ...sectionEditorProps
};

module.exports = ImageTilesEditor;
