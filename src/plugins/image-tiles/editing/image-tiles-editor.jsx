const React = require('react');
const { Switch } = require('antd');
const autoBind = require('auto-bind');
const Form = require('antd/lib/form');
const Input = require('antd/lib/input');
const Radio = require('antd/lib/radio');
const Slider = require('antd/lib/slider');
const ClientSettings = require('../../../bootstrap/client-settings');
const { inject } = require('../../../components/container-context.jsx');
const CdnFilePicker = require('../../../components/cdn-file-picker.jsx');
const ObjectMaxWidthSlider = require('../../../components/object-max-width-slider.jsx');
const { sectionEditorProps, clientSettingsProps } = require('../../../ui/default-prop-types');

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const FormItem = Form.Item;
const { TextArea } = Input;

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

  render() {
    const { docKey, content, clientSettings } = this.props;
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
        </Form>
      </div>
    );
  }
}

ImageTilesEditor.propTypes = {
  ...sectionEditorProps,
  ...clientSettingsProps
};

module.exports = inject({
  clientSettings: ClientSettings
}, ImageTilesEditor);

