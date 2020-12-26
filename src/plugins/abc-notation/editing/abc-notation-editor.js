import React from 'react';
import autoBind from 'auto-bind';
import { Form, Input, Switch } from 'antd';
import { sectionEditorProps } from '../../../ui/default-prop-types';
import ObjectMaxWidthSlider from '../../../components/object-max-width-slider';

const { TextArea } = Input;

class AbcNotationEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
  }

  handleCurrentAbcCodeChanged(event) {
    const newValue = event.target.value;
    this.changeContent({ abcCode: newValue });
  }

  handleDisplayMidiChanged(checked) {
    this.changeContent({ displayMidi: !!checked });
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
    const { abcCode, maxWidth, displayMidi, text } = content;

    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 14 }
    };

    return (
      <div>
        <Form layout="horizontal">
          <Form.Item label="ABC-Code" {...formItemLayout}>
            <TextArea value={abcCode} onChange={this.handleCurrentAbcCodeChanged} autoSize={{ minRows: 5 }} />
          </Form.Item>
          <Form.Item label="MIDI-Sound" {...formItemLayout}>
            <Switch checked={!!displayMidi} onChange={this.handleDisplayMidiChanged} />
          </Form.Item>
          <Form.Item label="Maximale Breite" {...formItemLayout}>
            <ObjectMaxWidthSlider defaultValue={100} value={maxWidth} onChange={this.handleMaxWidthChanged} />
          </Form.Item>
          <Form.Item label="Copyright Infos" {...formItemLayout}>
            <TextArea value={text} onChange={this.handleCurrentTextChanged} autoSize={{ minRows: 3 }} />
          </Form.Item>
        </Form>
      </div>
    );
  }
}

AbcNotationEditor.propTypes = {
  ...sectionEditorProps
};

export default AbcNotationEditor;
