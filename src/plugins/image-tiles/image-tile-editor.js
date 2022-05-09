import React from 'react';
import PropTypes from 'prop-types';
import { Form, Input, Radio } from 'antd';
import { useTranslation } from 'react-i18next';
import validation from '../../ui/validation.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { useService } from '../../components/container-context.js';
import DocumentSelector from '../../components/document-selector.js';
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

  const tileContent = { image, description, link };

  const triggerChange = newTileContentValues => {
    onChange(index, { ...tileContent, ...newTileContentValues });
  };

  const handleExternalImageUrlValueChanged = event => {
    const { value } = event.target;
    triggerChange({ image: { sourceUrl: value, sourceType: image.sourceType } });
  };

  const handleInternalImageUrlValueChanged = e => {
    triggerChange({ image: { sourceUrl: e.target.value, sourceType: image.sourceType } });
  };

  const handleInternalImageUrlFileNameChanged = value => {
    triggerChange({ image: { sourceUrl: value, sourceType: image.sourceType } });
  };

  const handleImageSourceTypeValueChanged = event => {
    const { value } = event.target;
    triggerChange({ image: { sourceUrl: '', sourceType: value } });
  };

  const handleDescriptionValueChanged = event => {
    const { value } = event.target;
    triggerChange({ description: value });
  };

  const handleLinkSourceTypeValueChanged = event => {
    const { value } = event.target;
    triggerChange({ link: { sourceUrl: '', sourceType: value } });
  };

  const handleExternalLinkUrlValueChanged = event => {
    const { value } = event.target;
    triggerChange({ link: { sourceUrl: value, sourceType: link.sourceType, documentId: '' } });
  };

  const handleDocumentChange = value => {
    triggerChange({ link: { sourceUrl: '', sourceType: link.sourceType, documentId: value } });
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
        <FormItem label={t('common:externalUrl')} {...formItemLayout} {...validation.validateUrl(link.sourceUrl, t, { allowHttp: true, allowMailto: true })} hasFeedback>
          <Input value={link.sourceUrl} onChange={handleExternalLinkUrlValueChanged} />
        </FormItem>
      )}
      {link.sourceType === LINK_SOURCE_TYPE.document && (
        <FormItem label={t('documentTitle')} {...formItemLayout}>
          <DocumentSelector documentId={link.documentId} onChange={handleDocumentChange} />
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
