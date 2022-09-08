import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import validation from '../../ui/validation.js';
import { LINK_SOURCE_TYPE } from './constants.js';
import React, { Fragment, useState } from 'react';
import { Button, Form, Input, Radio } from 'antd';
import MarkdownInput from '../../components/markdown-input.js';
import DocumentSelector from '../../components/document-selector.js';
import { CDN_URL_PREFIX, IMAGE_SOURCE_TYPE } from '../../domain/constants.js';
import ResourcePicker from '../../components/resource-picker/resource-picker.js';
import { storageLocationPathToUrl, urlToStorageLocationPath } from '../../utils/storage-utils.js';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const FormItem = Form.Item;

const formItemLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 14 }
};

function CatalogItemEditor({ item, enableImageEditing, onChange }) {
  const { t } = useTranslation('catalog');
  const [currentDocumentTitle, setCurrentDocumentTitle] = useState('');

  const { title, link, image } = item;

  const triggerChange = newItemContentValues => {
    onChange({ ...item, ...newItemContentValues });
  };

  const handleExternalImageUrlChange = event => {
    triggerChange({ image: { ...image, sourceUrl: event.target.value } });
  };

  const handleInternalImageUrlChange = event => {
    triggerChange({ image: { ...image, sourceUrl: event.target.value } });
  };

  const handleInternalImageResourceUrlChange = value => {
    triggerChange({ image: { ...image, sourceUrl: value } });
  };

  const handleImageSourceTypeChange = event => {
    triggerChange({ image: { sourceType: event.target.value, sourceUrl: '' } });
  };

  const handleTitleChange = event => {
    triggerChange({ title: event.target.value });
  };

  const handleLinkSourceTypeChange = event => {
    triggerChange({ link: { sourceType: event.target.value, sourceUrl: '', documentId: null } });
  };

  const handleExternalLinkUrlValueChange = event => {
    triggerChange({ link: { ...link, sourceUrl: event.target.value, documentId: null } });
  };

  const handleDocumentChange = value => {
    triggerChange({ link: { ...link, sourceUrl: '', documentId: value } });
  };

  const handleDocumentTitleChange = newDocumentTitle => {
    setCurrentDocumentTitle(newDocumentTitle);
  };

  const handleAdoptDocumentTitle = () => {
    triggerChange({ title: currentDocumentTitle });
  };

  return (
    <Fragment>
      <FormItem label={t('common:title')} {...formItemLayout}>
        <MarkdownInput inline value={title} onChange={handleTitleChange} />
      </FormItem>
      <FormItem label={t('linkSource')} {...formItemLayout}>
        <RadioGroup value={link.sourceType} onChange={handleLinkSourceTypeChange}>
          <RadioButton value={LINK_SOURCE_TYPE.document}>{t('documentLink')}</RadioButton>
          <RadioButton value={LINK_SOURCE_TYPE.external}>{t('common:externalLink')}</RadioButton>
        </RadioGroup>
      </FormItem>
      {link.sourceType === LINK_SOURCE_TYPE.external && (
        <FormItem
          label={t('common:externalUrl')}
          {...formItemLayout}
          {...validation.validateUrl(link.sourceUrl, t, { allowHttp: true, allowMailto: true })}
          hasFeedback
          >
          <Input value={link.sourceUrl} onChange={handleExternalLinkUrlValueChange} />
        </FormItem>
      )}
      {link.sourceType === LINK_SOURCE_TYPE.document && (
        <FormItem label={t('common:document')} {...formItemLayout}>
          <div className="u-input-and-button">
            <DocumentSelector
              documentId={link.documentId}
              onChange={handleDocumentChange}
              onTitleChange={handleDocumentTitleChange}
              />
            <Button
              type="primary"
              disabled={!currentDocumentTitle || currentDocumentTitle === title}
              onClick={handleAdoptDocumentTitle}
              >
              {t('adoptDocumentTitle')}
            </Button>
          </div>
        </FormItem>
      )}
      {enableImageEditing && (
        <Fragment>
          <FormItem label={t('common:imageSource')} {...formItemLayout}>
            <RadioGroup value={image.sourceType} onChange={handleImageSourceTypeChange}>
              <RadioButton value="internal">{t('common:internalCdn')}</RadioButton>
              <RadioButton value="external">{t('common:externalLink')}</RadioButton>
            </RadioGroup>
          </FormItem>
          {image.sourceType === IMAGE_SOURCE_TYPE.external && (
            <FormItem
              label={t('common:externalUrl')}
              {...formItemLayout}
              {...validation.validateUrl(image.sourceUrl, t)}
              hasFeedback
              >
              <Input value={image.sourceUrl} onChange={handleExternalImageUrlChange} />
            </FormItem>
          )}
          {image.sourceType === IMAGE_SOURCE_TYPE.internal && (
            <FormItem label={t('common:internalUrl')} {...formItemLayout}>
              <div className="u-input-and-button">
                <Input
                  addonBefore={CDN_URL_PREFIX}
                  value={image.sourceUrl}
                  onChange={handleInternalImageUrlChange}
                  />
                <ResourcePicker
                  url={storageLocationPathToUrl(image.sourceUrl)}
                  onUrlChange={url => handleInternalImageResourceUrlChange(urlToStorageLocationPath(url))}
                  />
              </div>
            </FormItem>
          )}
        </Fragment>
      )}
    </Fragment>
  );
}

CatalogItemEditor.propTypes = {
  enableImageEditing: PropTypes.bool.isRequired,
  item: PropTypes.shape({
    title: PropTypes.string,
    link: PropTypes.shape({
      sourceType: PropTypes.string.isRequired,
      sourceUrl: PropTypes.string,
      documentId: PropTypes.string
    }).isRequired,
    image: PropTypes.shape({
      sourceType: PropTypes.string.isRequired,
      sourceUrl: PropTypes.string
    }).isRequired
  }).isRequired,
  onChange: PropTypes.func.isRequired
};

export default CatalogItemEditor;
