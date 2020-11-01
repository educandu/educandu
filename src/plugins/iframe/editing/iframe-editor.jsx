const React = require('react');
const autoBind = require('auto-bind');
const Form = require('antd/lib/form');
const Input = require('antd/lib/input');
const Slider = require('antd/lib/slider');
const Checkbox = require('antd/lib/checkbox');
const { sectionEditorProps } = require('../../../ui/default-prop-types');
const ObjectMaxWidthSlider = require('../../../components/object-max-width-slider.jsx');

const FormItem = Form.Item;

const tipFormatter = val => `${val}px`;
const marks = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].reduce((all, val) => {
  const node = <span>{`${val}px`}</span>;
  return { ...all, [val]: node };
}, {});

const validateUrl = url => url === '' || url.startsWith('https:');

class IframeEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
  }

  handleExternalUrlValueChanged(event) {
    const { value } = event.target;
    this.changeContent({ url: value });
  }

  handleWidthValueChanged(value) {
    this.changeContent({ width: value });
  }

  handleHeightValueChanged(value) {
    this.changeContent({ height: value });
  }

  handleIsBorderVisibleValueChanged(event) {
    const { checked } = event.target;
    this.changeContent({ isBorderVisible: checked });
  }

  changeContent(newContentValues) {
    const { content, onContentChanged } = this.props;
    const newContent = { ...content, ...newContentValues };
    const isValid = validateUrl(newContent.url);
    onContentChanged(newContent, !isValid);
  }

  render() {
    const { content } = this.props;
    const { url, width } = content;

    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 14 }
    };

    const isUrlValid = validateUrl(url);
    let validateStatus;
    let help;
    if (isUrlValid) {
      if (url === '') {
        validateStatus = 'warning';
        help = 'Bitte geben Sie eine Adresse an.';
      } else {
        validateStatus = 'success';
        help = null;
      }
    } else {
      validateStatus = 'error';
      help = 'Sie können nur Seiten mit sicherem Protokoll (https) einbetten.';
    }

    return (
      <div>
        <Form layout="horizontal">
          <FormItem
            {...formItemLayout}
            label="URL"
            help={help}
            validateStatus={validateStatus}
            hasFeedback
            >
            <Input value={url} onChange={this.handleExternalUrlValueChanged} />
          </FormItem>
          <Form.Item label="Breite" {...formItemLayout}>
            <ObjectMaxWidthSlider value={width} onChange={this.handleWidthValueChanged} />
          </Form.Item>
          <Form.Item label="Höhe" {...formItemLayout}>
            <Slider
              min={100}
              max={1000}
              marks={marks}
              step={10}
              value={content.height}
              onChange={this.handleHeightValueChanged}
              tipFormatter={tipFormatter}
              />
          </Form.Item>
          <Form.Item label="Rahmen" {...formItemLayout}>
            <Checkbox checked={content.isBorderVisible} onChange={this.handleIsBorderVisibleValueChanged} />
          </Form.Item>
        </Form>
      </div>
    );
  }
}

IframeEditor.propTypes = {
  ...sectionEditorProps
};

module.exports = IframeEditor;
