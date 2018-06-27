const React = require('react');
const autoBind = require('auto-bind');
const { Form, Input } = require('antd');
const { sectionEditorProps } = require('../../../ui/default-prop-types');
const ObjectMaxWidthSlider = require('../../../components/object-max-width-slider.jsx');

class YoutubeVideoEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
  }

  handleUrlValueChanged(event) {
    const { value } = event.target;
    this.changeContent({ url: value });
  }

  handleMaxWidthValueChanged(value) {
    this.changeContent({ maxWidth: value });
  }

  changeContent(newContentValues) {
    const { content, onContentChanged } = this.props;
    onContentChanged({ ...content, ...newContentValues });
  }

  render() {
    const { content } = this.props;
    const { url, maxWidth } = content;

    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 14 }
    };

    return (
      <div>
        <Form layout="horizontal">
          <Form.Item label="URL" {...formItemLayout}>
            <Input placeholder="URL" value={url} onChange={this.handleUrlValueChanged} />
          </Form.Item>
          <Form.Item label="Maximale Breite" {...formItemLayout}>
            <ObjectMaxWidthSlider value={maxWidth} onChange={this.handleMaxWidthValueChanged} />
          </Form.Item>
        </Form>
      </div>
    );
  }
}

YoutubeVideoEditor.propTypes = {
  ...sectionEditorProps
};

module.exports = YoutubeVideoEditor;
