import React from 'react';
import PropTypes from 'prop-types';
import urls from '../../utils/urls.js';
import { Form, Input, Radio } from 'antd';
import { useTranslation } from 'react-i18next';
import validation from '../../ui/validation.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { useService } from '../../components/container-context.js';
import { IMAGE_SOURCE_TYPE, LINK_SOURCE_TYPE } from './constants.js';
import StorageFilePicker from '../../components/storage-file-picker.js';
import { filePickerStorageShape } from '../../ui/default-prop-types.js';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const FormItem = Form.Item;

function ImageTileEditor({ index, image, description, link, publicStorage, privateStorage, onChange }) {
  const { t } = useTranslation('imageTiles');
  const clientConfig = useService(ClientConfig);

  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 14 }
  };

  const handleExternalImageUrlValueChanged = event => {
    const { value } = event.target;
    onChange(index, { image: { sourceUrl: value, sourceType: image.sourceType } });
  };

  const handleInternalImageUrlValueChanged = e => {
    onChange(index, { image: { sourceUrl: e.target.value, sourceType: image.sourceType } });
  };

  const handleInternalImageUrlFileNameChanged = value => {
    onChange(index, { image: { sourceUrl: value, sourceType: image.sourceType } });
  };

  const handleImageSourceTypeValueChanged = event => {
    const { value } = event.target;
    onChange(index, { image: { sourceUrl: '', sourceType: value } });
  };

  const handleDescriptionValueChanged = event => {
    const { value } = event.target;
    onChange(index, { description: value });
  };

  const handleLinkSourceTypeValueChanged = event => {
    const { value } = event.target;
    onChange(index, { link: { sourceUrl: '', sourceType: value } });
  };

  const handleLinkSourceUrlValueChanged = event => {
    const { value } = event.target;
    onChange(index, { link: { sourceUrl: value, sourceType: link.sourceType, documentId: '' } });
  };

  const handleLinkDocumentIdValueChanged = event => {
    const { value } = event.target;
    onChange(index, { link: { sourceUrl: '', sourceType: link.sourceType, documentId: value } });
  };

  return (
    <React.Fragment>
      <FormItem label={t('imageSource')} {...formItemLayout}>
        <RadioGroup value={image.sourceType} onChange={handleImageSourceTypeValueChanged}>
          <RadioButton value="external">{t('common:externalLink')}</RadioButton>
          <RadioButton value="internal">{t('common:internalCdn')}</RadioButton>
        </RadioGroup>
      </FormItem>
      {image.sourceType === IMAGE_SOURCE_TYPE.external && (
        <FormItem label={t('common:externalUrl')} {...formItemLayout} {...validation.validateUrl(image.sourceUrl, t)} hasFeedback>
          <Input value={image.sourceUrl} onChange={handleExternalImageUrlValueChanged} />
        </FormItem>
      )}
      {image.sourceType === IMAGE_SOURCE_TYPE.internal && (
        <FormItem label={t('common:internalUrl')} {...formItemLayout}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Input
              addonBefore={`${clientConfig.cdnRootUrl}/`}
              value={image.sourceUrl}
              onChange={handleInternalImageUrlValueChanged}
              />
            <StorageFilePicker
              publicStorage={publicStorage}
              privateStorage={privateStorage}
              fileName={image.sourceUrl}
              onFileNameChanged={handleInternalImageUrlFileNameChanged}
              />
          </div>
        </FormItem>
      )}
      <FormItem label={t('imageDescription')} {...formItemLayout}>
        <Input value={description} onChange={handleDescriptionValueChanged} />
      </FormItem>
      <FormItem label={t('linkSource')} {...formItemLayout}>
        <RadioGroup value={link.sourceType} onChange={handleLinkSourceTypeValueChanged}>
          <RadioButton value={LINK_SOURCE_TYPE.external}>{t('common:externalLink')}</RadioButton>
          <RadioButton value={LINK_SOURCE_TYPE.document}>{t('documentLink')}</RadioButton>
        </RadioGroup>
      </FormItem>
      {link.sourceType === LINK_SOURCE_TYPE.external && (
        <FormItem label={t('common:externalUrl')} {...formItemLayout} {...validation.validateUrl(link.sourceUrl, t, { allowInsecure: true })} hasFeedback>
          <Input value={link.sourceUrl} onChange={handleLinkSourceUrlValueChanged} />
        </FormItem>
      )}
      {link.sourceType === LINK_SOURCE_TYPE.document && (
        <FormItem label={t('documentKey')} {...formItemLayout}>
          <Input addonBefore={urls.docsPrefix} value={link.documentId} onChange={handleLinkDocumentIdValueChanged} />
        </FormItem>
      )}
    </React.Fragment>
  );
}

ImageTileEditor.propTypes = {
  description: PropTypes.string,
  image: PropTypes.shape({
    sourceType: PropTypes.string.isRequired,
    sourceUrl: PropTypes.string
  }).isRequired,
  index: PropTypes.number.isRequired,
  link: PropTypes.shape({
    sourceType: PropTypes.string.isRequired,
    sourceUrl: PropTypes.string,
    documentId: PropTypes.string
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  privateStorage: filePickerStorageShape,
  publicStorage: filePickerStorageShape.isRequired
};

ImageTileEditor.defaultProps = {
  description: null,
  privateStorage: null
};

export default ImageTileEditor;
