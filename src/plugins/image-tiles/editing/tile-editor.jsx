const React = require('react');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const urls = require('../../../utils/urls');
const { Form, Input, Radio } = require('antd');
const validation = require('../../../ui/validation');
const ClientSettings = require('../../../bootstrap/client-settings');
const { inject } = require('../../../components/container-context.jsx');
const CdnFilePicker = require('../../../components/cdn-file-picker.jsx');
const { clientSettingsProps } = require('../../../ui/default-prop-types');

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

  handleInternalImageUrlValueChanged(value) {
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
    const { docKey, clientSettings, image, description, link } = this.props;

    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 14 }
    };

    return (
      <React.Fragment>
        <FormItem label="Bildquelle" {...formItemLayout}>
          <RadioGroup value={image.type} onChange={this.handleImageTypeValueChanged}>
            <RadioButton value="external">Externer Link</RadioButton>
            <RadioButton value="internal">Elmu CDN</RadioButton>
          </RadioGroup>
        </FormItem>
        {image.type === 'external' && (
          <FormItem label="Externe URL" {...formItemLayout} {...validation.validateUrl(image.url)} hasFeedback>
            <Input value={image.url} onChange={this.handleExternalImageUrlValueChanged} />
          </FormItem>
        )}
        {image.type === 'internal' && (
          <FormItem label="Interne URL" {...formItemLayout}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Input
                addonBefore={`${clientSettings.cdnRootUrl}/`}
                value={image.url}
                readOnly
                />
              <CdnFilePicker
                rootPrefix="media"
                uploadPrefix={`media/${docKey}`}
                initialPrefix={`media/${docKey}`}
                fileName={image.url}
                onFileNameChanged={this.handleInternalImageUrlValueChanged}
                />
            </div>
          </FormItem>
        )}
        <FormItem label="Bildunterschrift" {...formItemLayout}>
          <Input value={description} onChange={this.handleDescriptionValueChanged} />
        </FormItem>
        <FormItem label="Linkquelle" {...formItemLayout}>
          <RadioGroup value={link.type} onChange={this.handleLinkTypeValueChanged}>
            <RadioButton value="external">Externer Link</RadioButton>
            <RadioButton value="menu">Menü-Link</RadioButton>
            <RadioButton value="article">Artikel-Link</RadioButton>
          </RadioGroup>
        </FormItem>
        {link.type === 'external' && (
          <FormItem label="Externe URL" {...formItemLayout} {...validation.validateUrl(link.url, { allowInsecure: true })} hasFeedback>
            <Input value={link.url} onChange={this.handleLinkUrlValueChanged} />
          </FormItem>
        )}
        {link.type === 'menu' && (
          <FormItem label="Externe URL" {...formItemLayout}>
            <Input addonBefore={urls.menusPrefix} value={link.url} onChange={this.handleLinkUrlValueChanged} />
          </FormItem>
        )}
        {link.type === 'article' && (
          <FormItem label="Externe URL" {...formItemLayout}>
            <Input addonBefore={urls.articlesPrefix} value={link.url} onChange={this.handleLinkUrlValueChanged} />
          </FormItem>
        )}
      </React.Fragment>
    );
  }
}

TileEditor.propTypes = {
  ...clientSettingsProps,
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

module.exports = inject({
  clientSettings: ClientSettings
}, TileEditor);
