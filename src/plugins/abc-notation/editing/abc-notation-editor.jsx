const React = require('react');
const Form = require('antd/lib/form');
const autoBind = require('auto-bind');
const Input = require('antd/lib/input');
const { sectionEditorProps } = require('../../../ui/default-prop-types');
const ObjectMaxWidthSlider = require('../../../components/object-max-width-slider.jsx');

const { TextArea } = Input;

class AbcNotationEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
  }

  handleCurrentAbcCodeChanged(event) {
    const newValue = event.target.value;
    this.changeContent({ abcCode: newValue });
  }

  handleMaxWidthChanged(newValue) {
    this.changeContent({ maxWidth: newValue });
  }

  handleCurrentTextChanged(event) {
    const newValue = event.target.value;
    this.changeContent({ text: newValue });
  }

  changeContent(newContentValues) {
    const { content, onContentChanged } = this.props;
    onContentChanged({ ...content, ...newContentValues });
  }

  render() {
    const { content } = this.props;
    const { abcCode, maxWidth, text } = content;

    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 14 }
    };

    return (
      <div>
        <Form layout="horizontal">
          <Form.Item label="ABC Code" {...formItemLayout}>
            <TextArea value={abcCode} onChange={this.handleCurrentAbcCodeChanged} autosize={{ minRows: 5 }} />
          </Form.Item>
          <Form.Item label="Maximale Breite" {...formItemLayout}>
            <ObjectMaxWidthSlider defaultValue={100} value={maxWidth} onChange={this.handleMaxWidthChanged} />
          </Form.Item>
          <Form.Item label="Copyright Infos" {...formItemLayout}>
            <TextArea value={text} onChange={this.handleCurrentTextChanged} autosize={{ minRows: 3 }} />
          </Form.Item>
        </Form>
      </div>
    );
  }
}

AbcNotationEditor.propTypes = {
  ...sectionEditorProps
};

module.exports = AbcNotationEditor;
