import React from 'react';
import autoBind from 'auto-bind';
import { withTranslation } from 'react-i18next';
import validation from '../../../ui/validation.js';
import { Form, Input, Radio, InputNumber } from 'antd';
import ClientConfig from '../../../bootstrap/client-config.js';
import { inject } from '../../../components/container-context.js';
import CdnFilePicker from '../../../components/cdn-file-picker.js';
import { EFFECT_TYPE, SOURCE_TYPE, ORIENTATION } from '../constants.js';
import ObjectMaxWidthSlider from '../../../components/object-max-width-slider.js';
import { sectionEditorProps, clientConfigProps, translationProps } from '../../../ui/default-prop-types.js';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const FormItem = Form.Item;
const { TextArea } = Input;

class ImageEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
  }

  handleExternalSourceUrlValueChanged(event) {
    const { value } = event.target;
    this.changeContent({ sourceUrl: value });
  }

  handleEffectExternalSourceUrlValueChanged(event) {
    const { value } = event.target;
    const effect = { ...this.props.content.effect, sourceUrl: value };
    this.changeContent({ effect });
  }

  handleInternalSourceUrlValueChanged(e) {
    this.changeContent({ sourceUrl: e.target.value });
  }

  handleEffectInternalSourceUrlValueChanged(e) {
    const effect = { ...this.props.content.effect, sourceUrl: e.target.value };
    this.changeContent({ effect });
  }

  handleInternalSourceUrlFileNameChanged(value) {
    this.changeContent({ sourceUrl: value });
  }

  handleEffectInternalSourceUrlFileNameChanged(value) {
    const effect = { ...this.props.content.effect, sourceUrl: value };
    this.changeContent({ effect });
  }

  handleSourceTypeValueChanged(event) {
    const { value } = event.target;
    this.changeContent({ sourceType: value, sourceUrl: '' });
  }

  handleEffectSourceTypeValueChanged(event) {
    const { value } = event.target;
    const effect = { ...this.props.content.effect };
    effect.sourceType = value;
    effect.sourceUrl = '';
    this.changeContent({ effect });
  }

  handleMaxWidthValueChanged(value) {
    this.changeContent({ maxWidth: value });
  }

  changeContent(newContentValues) {
    const { content, onContentChanged } = this.props;
    onContentChanged({ ...content, ...newContentValues });
  }

  handleCopyrightInfoValueChanged(event) {
    const newValue = event.target.value;
    this.changeContent({ text: newValue });
  }

  handleOrientationValueChanged(e) {
    const effect = {
      ...this.props.content.effect, orientation: e.target.value
    };

    this.changeContent({ effect });
  }

  handleEffectOptionChange(e) {
    const currentEffect = this.props.content.effect;

    const baseProps = {
      sourceType: currentEffect?.sourceType || SOURCE_TYPE.internal,
      sourceUrl: currentEffect?.sourceUrl || '',
      text: currentEffect?.text || ''
    };

    switch (e.target.value) {
      case EFFECT_TYPE.reveal:
        this.changeContent({
          effect: {
            ...baseProps,
            type: EFFECT_TYPE.reveal,
            startPosition: 10,
            orientation: ORIENTATION.horizontal
          }
        });
        break;
      case EFFECT_TYPE.hover:
        this.changeContent({
          effect: {
            ...baseProps,
            type: EFFECT_TYPE.hover
          }
        });
        break;
      case EFFECT_TYPE.none:
      default:
        this.changeContent({ effect: null });
    }
  }

  handleEffectCopyrightInfoValueChanged(event) {
    const newValue = event.target.value;
    const effect = { ...this.props.content.effect };
    effect.text = newValue;
    this.changeContent({ effect });
  }

  handleStartPositionValueChanged(newPosition) {
    const effect = { ...this.props.content.effect };
    effect.startPosition = Math.max(0, Math.min(100, newPosition));
    this.changeContent({ effect });
  }

  render() {
    const { sectionContainerId, content, clientConfig, t } = this.props;
    const { sourceType, sourceUrl, maxWidth, text, effect } = content;

    const effectType = effect?.type || EFFECT_TYPE.none;

    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 14 }
    };

    return (
      <div>
        <Form layout="horizontal">
          <FormItem label={t('source')} {...formItemLayout}>
            <RadioGroup value={sourceType} onChange={this.handleSourceTypeValueChanged}>
              <RadioButton value={SOURCE_TYPE.external}>{t('externalLink')}</RadioButton>
              <RadioButton value={SOURCE_TYPE.internal}>{t('internalCdn')}</RadioButton>
            </RadioGroup>
          </FormItem>
          {sourceType === SOURCE_TYPE.external && (
            <FormItem label={t('externalUrl')} {...formItemLayout} {...validation.validateUrl(sourceUrl, t)} hasFeedback>
              <Input value={sourceUrl} onChange={this.handleExternalSourceUrlValueChanged} />
            </FormItem>
          )}
          {sourceType === SOURCE_TYPE.internal && (
            <FormItem label={t('internalUrl')} {...formItemLayout}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Input
                  addonBefore={`${clientConfig.cdnRootUrl}/`}
                  value={sourceUrl}
                  onChange={this.handleInternalSourceUrlValueChanged}
                  />
                <CdnFilePicker
                  rootPrefix="media"
                  uploadPrefix={`media/${sectionContainerId}`}
                  initialPrefix={`media/${sectionContainerId}`}
                  fileName={sourceUrl}
                  onFileNameChanged={this.handleInternalSourceUrlFileNameChanged}
                  />
              </div>
            </FormItem>
          )}
          <Form.Item label={t('copyrightInfos')} {...formItemLayout}>
            <TextArea value={text} onChange={this.handleCopyrightInfoValueChanged} autoSize={{ minRows: 3 }} />
          </Form.Item>
          <Form.Item label={t('effectTypeLabel')} {...formItemLayout}>
            <RadioGroup value={effectType} onChange={this.handleEffectOptionChange}>
              <RadioButton value={EFFECT_TYPE.none}>{t('noneOption')}</RadioButton>
              <RadioButton value={EFFECT_TYPE.hover}>{t('hoverOption')}</RadioButton>
              <RadioButton value={EFFECT_TYPE.reveal}>{t('revealOption')}</RadioButton>
            </RadioGroup>
          </Form.Item>
          {effect && (
            <div className="Panel">
              <div className="Panel-content Panel-content--darker">
                <FormItem label={t('source')} {...formItemLayout}>
                  <RadioGroup value={effect.sourceType} onChange={this.handleEffectSourceTypeValueChanged}>
                    <RadioButton value="external">{t('externalLink')}</RadioButton>
                    <RadioButton value="internal">{t('internalCdn')}</RadioButton>
                  </RadioGroup>
                </FormItem>
                {effect.sourceType === SOURCE_TYPE.external && (
                  <FormItem label={t('externalUrl')} {...formItemLayout} {...validation.validateUrl(effect.sourceUrl, t)} hasFeedback>
                    <Input value={effect.sourceUrl} onChange={this.handleEffectExternalSourceUrlValueChanged} />
                  </FormItem>
                )}
                {effect.sourceType === SOURCE_TYPE.internal && (
                  <FormItem label={t('internalUrl')} {...formItemLayout}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Input
                        addonBefore={`${clientConfig.cdnRootUrl}/`}
                        value={effect.sourceUrl}
                        onChange={this.handleEffectInternalSourceUrlValueChanged}
                        />
                      <CdnFilePicker
                        rootPrefix="media"
                        uploadPrefix={`media/${sectionContainerId}`}
                        initialPrefix={`media/${sectionContainerId}`}
                        fileName={effect.sourceUrl}
                        onFileNameChanged={this.handleEffectInternalSourceUrlFileNameChanged}
                        />
                    </div>
                  </FormItem>
                )}
                <Form.Item label={t('copyrightInfos')} {...formItemLayout}>
                  <TextArea value={effect.text} onChange={this.handleEffectCopyrightInfoValueChanged} autoSize={{ minRows: 3 }} />
                </Form.Item>
                {effect.type === EFFECT_TYPE.reveal && (
                  <div>
                    <FormItem label={t('startPosition')} {...formItemLayout}>
                      <InputNumber
                        defaultValue={effect.startPosition}
                        min={0}
                        max={100}
                        formatter={value => `${value}%`}
                        parser={value => value.replace('%', '')}
                        onChange={this.handleStartPositionValueChanged}
                        />
                    </FormItem>
                    <FormItem label={t('orientationLabel')} {...formItemLayout}>
                      <RadioGroup value={effect.orientation} onChange={this.handleOrientationValueChanged}>
                        <RadioButton value={ORIENTATION.horizontal}>{t('orientationOptionHorizontal')}</RadioButton>
                        <RadioButton value={ORIENTATION.vertical}>{t('orientationOptionVertical')}</RadioButton>
                      </RadioGroup>
                    </FormItem>
                  </div>
                )}
              </div>
            </div>
          )}
          <Form.Item label={t('maximumWidth')} {...formItemLayout}>
            <ObjectMaxWidthSlider value={maxWidth} onChange={this.handleMaxWidthValueChanged} />
          </Form.Item>
        </Form>
      </div>
    );
  }
}

ImageEditor.propTypes = {
  ...translationProps,
  ...sectionEditorProps,
  ...clientConfigProps
};

export default withTranslation('image')(inject({
  clientConfig: ClientConfig
}, ImageEditor));

