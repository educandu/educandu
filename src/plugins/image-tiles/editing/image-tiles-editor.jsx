const React = require('react');
const autoBind = require('auto-bind');
const Form = require('antd/lib/form');
const Radio = require('antd/lib/radio');
const Slider = require('antd/lib/slider');
const TileEditor = require('./tile-editor.jsx');
const { sectionEditorProps } = require('../../../ui/default-prop-types');
const ObjectMaxWidthSlider = require('../../../components/object-max-width-slider.jsx');

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

class ImageTilesEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
  }

  handleMaxWidthValueChanged(value) {
    this.changeContent({ maxWidth: value });
  }

  changeContent(newContentValues) {
    const { content, onContentChanged } = this.props;
    onContentChanged({ ...content, ...newContentValues });
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
    this.changeContent({ hoverEffect: value || null });
  }

  handleTileChange(index, newValues) {
    const newTiles = this.props.content.tiles.slice();
    newTiles[index] = { ...newTiles[index], ...newValues };
    this.changeContent({ tiles: newTiles });
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
          <Form.Item label="Maximale Anzahl an Kacheln pro Zeile" {...formItemLayout}>
            <Slider
              min={0}
              max={10}
              step={1}
              value={maxTilesPerRow}
              onChange={this.handleMaxTilesPerRowChanged}
              />
          </Form.Item>
          <Form.Item label="Hovereffekt" {...formItemLayout}>
            <RadioGroup value={hoverEffect} onChange={this.handleHoverEffectValueChanged}>
              <RadioButton value="">kein Effekt</RadioButton>
              <RadioButton value="colorize-zoom">Färben und Zoomen</RadioButton>
            </RadioGroup>
          </Form.Item>
          {tiles.map((tile, index) => <TileEditor key={index.toString()} {...tile} index={index} onChange={this.handleTileChange} docKey={docKey} />)}
        </Form>
      </div>
    );
  }
}

ImageTilesEditor.propTypes = {
  ...sectionEditorProps
};

module.exports = ImageTilesEditor;
