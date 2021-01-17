import React from 'react';
import autoBind from 'auto-bind';
import { Form, Input, Switch } from 'antd';
import { withTranslation } from 'react-i18next';
import ObjectMaxWidthSlider from '../../../components/object-max-width-slider';
import { sectionEditorProps, translationProps } from '../../../ui/default-prop-types';

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
    const { content, t } = this.props;
    const { abcCode, maxWidth, displayMidi, text } = content;

    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 14 }
    };

    return (
      <div>
        <Form layout="horizontal">
          <Form.Item label={t('abcCode')} {...formItemLayout}>
            <TextArea value={abcCode} onChange={this.handleCurrentAbcCodeChanged} autoSize={{ minRows: 5 }} />
          </Form.Item>
          <Form.Item label={t('midiSound')} {...formItemLayout}>
            <Switch checked={!!displayMidi} onChange={this.handleDisplayMidiChanged} />
          </Form.Item>
          <Form.Item label={t('maximumWidth')} {...formItemLayout}>
            <ObjectMaxWidthSlider defaultValue={100} value={maxWidth} onChange={this.handleMaxWidthChanged} />
          </Form.Item>
          <Form.Item label={t('copyrightInfos')} {...formItemLayout}>
            <TextArea value={text} onChange={this.handleCurrentTextChanged} autoSize={{ minRows: 3 }} />
          </Form.Item>
        </Form>
      </div>
    );
  }
}

AbcNotationEditor.propTypes = {
  ...translationProps,
  ...sectionEditorProps
};

export default withTranslation('abcNotation')(AbcNotationEditor);
