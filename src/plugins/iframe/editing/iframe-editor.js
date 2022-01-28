import React from 'react';
import autoBind from 'auto-bind';
import { withTranslation } from 'react-i18next';
import validation from '../../../ui/validation.js';
import { Form, Input, Slider, Checkbox } from 'antd';
import ObjectMaxWidthSlider from '../../../components/object-max-width-slider.js';
import { sectionEditorProps, translationProps } from '../../../ui/default-prop-types.js';

const FormItem = Form.Item;

const tipFormatter = val => `${val}px`;
const marks = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].reduce((all, val) => {
  const node = <span>{`${val}px`}</span>;
  return { ...all, [val]: node };
}, {});

class IframeEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
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
    const { content, onContentChanged, t } = this.props;
    const newContent = { ...content, ...newContentValues };
    const isValid = validation.validateUrl(newContent.url, t).validateStatus !== 'error';
    onContentChanged(newContent, !isValid);
  }

  render() {
    const { content, t } = this.props;
    const { url, width } = content;

    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 14 }
    };

    return (
      <div>
        <Form layout="horizontal">
          <FormItem
            {...formItemLayout}
            label={t('common:url')}
            {...validation.validateUrl(url, t)}
            hasFeedback
            >
            <Input value={url} onChange={this.handleExternalUrlValueChanged} />
          </FormItem>
          <Form.Item label={t('width')} {...formItemLayout}>
            <ObjectMaxWidthSlider value={width} onChange={this.handleWidthValueChanged} />
          </Form.Item>
          <Form.Item label={t('height')} {...formItemLayout}>
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
          <Form.Item label={t('frame')} {...formItemLayout}>
            <Checkbox checked={content.isBorderVisible} onChange={this.handleIsBorderVisibleValueChanged} />
          </Form.Item>
        </Form>
      </div>
    );
  }
}

IframeEditor.propTypes = {
  ...translationProps,
  ...sectionEditorProps
};

export default withTranslation('iframe')(IframeEditor);
