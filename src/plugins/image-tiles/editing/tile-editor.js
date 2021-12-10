import React from 'react';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import { Form, Input, Radio } from 'antd';
import urls from '../../../utils/urls.js';
import { withTranslation } from 'react-i18next';
import validation from '../../../ui/validation.js';
import { IMAGE_TYPE, LINK_TYPE } from '../constants.js';
import ClientConfig from '../../../bootstrap/client-config.js';
import { inject } from '../../../components/container-context.js';
import CdnFilePicker from '../../../components/cdn-file-picker.js';
import { clientConfigProps, translationProps } from '../../../ui/default-prop-types.js';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const FormItem = Form.Item;

class TileEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
  }

  handleExternalImageUrlValueChanged(event) {
    const { value } = event.target;
    this.props.onChange(this.props.index, { image: { url: value, type: this.props.image.type } });
  }

  handleInternalImageUrlValueChanged(e) {
    this.props.onChange(this.props.index, { image: { url: e.target.value, type: this.props.image.type } });
  }

  handleInternalImageUrlFileNameChanged(value) {
    this.props.onChange(this.props.index, { image: { url: value, type: this.props.image.type } });
  }

  handleImageTypeValueChanged(event) {
    const { value } = event.target;
    this.props.onChange(this.props.index, { image: { url: '', type: value } });
  }

  handleDescriptionValueChanged(event) {
    const { value } = event.target;
    this.props.onChange(this.props.index, { description: value });
  }

  handleLinkTypeValueChanged(event) {
    const { value } = event.target;
    this.props.onChange(this.props.index, { link: { url: '', type: value } });
  }

  handleLinkUrlValueChanged(event) {
    const { value } = event.target;
    this.props.onChange(this.props.index, { link: { url: value, type: this.props.link.type } });
  }

  render() {
    const { docKey, clientConfig, image, description, link, t } = this.props;

    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 14 }
    };

    return (
      <React.Fragment>
        <FormItem label={t('imageSource')} {...formItemLayout}>
          <RadioGroup value={image.type} onChange={this.handleImageTypeValueChanged}>
            <RadioButton value="external">{t('externalLink')}</RadioButton>
            <RadioButton value="internal">{t('internalCdn')}</RadioButton>
          </RadioGroup>
        </FormItem>
        {image.type === IMAGE_TYPE.external && (
          <FormItem label={t('externalUrl')} {...formItemLayout} {...validation.validateUrl(image.url, t)} hasFeedback>
            <Input value={image.url} onChange={this.handleExternalImageUrlValueChanged} />
          </FormItem>
        )}
        {image.type === IMAGE_TYPE.internal && (
          <FormItem label={t('internalUrl')} {...formItemLayout}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Input
                addonBefore={`${clientConfig.cdnRootUrl}/`}
                value={image.url}
                onChange={this.handleInternalImageUrlValueChanged}
                />
              <CdnFilePicker
                rootPrefix="media"
                uploadPrefix={`media/${docKey}`}
                initialPrefix={`media/${docKey}`}
                fileName={image.url}
                onFileNameChanged={this.handleInternalImageUrlFileNameChanged}
                />
            </div>
          </FormItem>
        )}
        <FormItem label={t('imageDescription')} {...formItemLayout}>
          <Input value={description} onChange={this.handleDescriptionValueChanged} />
        </FormItem>
        <FormItem label={t('linkSource')} {...formItemLayout}>
          <RadioGroup value={link.type} onChange={this.handleLinkTypeValueChanged}>
            <RadioButton value={LINK_TYPE.external}>{t('externalLink')}</RadioButton>
            <RadioButton value={LINK_TYPE.internal}>{t('internalLink')}</RadioButton>
          </RadioGroup>
        </FormItem>
        {link.type === LINK_TYPE.external && (
          <FormItem label={t('externalUrl')} {...formItemLayout} {...validation.validateUrl(link.url, t, { allowInsecure: true })} hasFeedback>
            <Input value={link.url} onChange={this.handleLinkUrlValueChanged} />
          </FormItem>
        )}
        {link.type === LINK_TYPE.internal && (
          <FormItem label={t('internalUrl')} {...formItemLayout}>
            <Input addonBefore={urls.docsPrefix} value={link.url} onChange={this.handleLinkUrlValueChanged} />
          </FormItem>
        )}
      </React.Fragment>
    );
  }
}

TileEditor.propTypes = {
  ...translationProps,
  ...clientConfigProps,
  description: PropTypes.string,
  docKey: PropTypes.string.isRequired,
  image: PropTypes.shape({
    type: PropTypes.string.isRequired,
    url: PropTypes.string
  }).isRequired,
  index: PropTypes.number.isRequired,
  link: PropTypes.shape({
    type: PropTypes.string.isRequired,
    url: PropTypes.string
  }).isRequired,
  onChange: PropTypes.func.isRequired
};

TileEditor.defaultProps = {
  description: null
};

export default withTranslation('imageTiles')(inject({
  clientConfig: ClientConfig
}, TileEditor));
