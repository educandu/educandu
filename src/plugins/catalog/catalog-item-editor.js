import PropTypes from 'prop-types';
import { Button, Form, Radio } from 'antd';
import { useTranslation } from 'react-i18next';
import { LINK_SOURCE_TYPE } from './constants.js';
import React, { Fragment, useState } from 'react';
import UrlInput from '../../components/url-input.js';
import { ensureIsExcluded } from '../../utils/array-utils.js';
import MarkdownInput from '../../components/markdown-input.js';
import DocumentSelector from '../../components/document-selector.js';
import { FORM_ITEM_LAYOUT, SOURCE_TYPE } from '../../domain/constants.js';
import NeverScrollingTextArea from '../../components/never-scrolling-text-area.js';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const FormItem = Form.Item;

function CatalogItemEditor({ item, enableImageEditing, onChange }) {
  const { t } = useTranslation('catalog');
  const [currentDocumentTitle, setCurrentDocumentTitle] = useState('');

  const { title, link, image } = item;

  const triggerChange = newItemContentValues => {
    onChange({ ...item, ...newItemContentValues });
  };

  const handleInternalImageUrlChange = value => {
    triggerChange({ image: { ...image, sourceUrl: value } });
  };

  const handleTitleChange = event => {
    triggerChange({ title: event.target.value });
  };

  const handleLinkSourceTypeChange = event => {
    triggerChange({ link: { ...link, sourceType: event.target.value, sourceUrl: '', documentId: null } });
  };

  const handleLinkSourceUrlChange = value => {
    triggerChange({ link: { ...link, sourceUrl: value, documentId: null } });
  };

  const handleLinkDocumentIdChange = value => {
    triggerChange({ link: { ...link, sourceUrl: '', documentId: value } });
  };

  const handleDocumentTitleChange = newDocumentTitle => {
    setCurrentDocumentTitle(newDocumentTitle);
  };

  const handleAdoptDocumentTitle = () => {
    triggerChange({ title: currentDocumentTitle });
  };

  const handleOnLinkDescriptionChange = event => {
    triggerChange({ link: { ...link, description: event.target.value } });
  };

  const allowedImageSourceTypes = ensureIsExcluded(Object.values(SOURCE_TYPE), SOURCE_TYPE.youtube);

  return (
    <Fragment>
      <FormItem label={t('common:title')} {...FORM_ITEM_LAYOUT}>
        <MarkdownInput inline value={title} onChange={handleTitleChange} />
      </FormItem>
      <FormItem label={t('linkSourceType')} {...FORM_ITEM_LAYOUT}>
        <RadioGroup value={link.sourceType} onChange={handleLinkSourceTypeChange}>
          <RadioButton value={LINK_SOURCE_TYPE.documentId}>{t('documentLink')}</RadioButton>
          <RadioButton value={LINK_SOURCE_TYPE.sourceUrl}>{t('link')}</RadioButton>
        </RadioGroup>
      </FormItem>
      {link.sourceType === LINK_SOURCE_TYPE.sourceUrl && (
        <FormItem label={t('linkSource')} {...FORM_ITEM_LAYOUT}>
          <UrlInput value={link.sourceUrl} onChange={handleLinkSourceUrlChange} />
        </FormItem>
      )}
      {link.sourceType === LINK_SOURCE_TYPE.documentId && (
        <FormItem label={t('common:document')} {...FORM_ITEM_LAYOUT}>
          <div className="u-input-and-button">
            <DocumentSelector
              documentId={link.documentId}
              onChange={handleLinkDocumentIdChange}
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
      {!!enableImageEditing && (
        <FormItem {...FORM_ITEM_LAYOUT} label={t('common:imageSource')}>
          <UrlInput value={image.sourceUrl} onChange={handleInternalImageUrlChange} allowedSourceTypes={allowedImageSourceTypes} />
        </FormItem>
      )}
      <FormItem {...FORM_ITEM_LAYOUT} label={t('common:description')}>
        <NeverScrollingTextArea
          debounced
          minRows={2}
          value={link.description}
          className="CatalogItemEditor-description"
          onChange={handleOnLinkDescriptionChange}
          />
      </FormItem>
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
      documentId: PropTypes.string,
      description: PropTypes.string
    }).isRequired,
    image: PropTypes.shape({
      sourceUrl: PropTypes.string
    }).isRequired
  }).isRequired,
  onChange: PropTypes.func.isRequired
};

export default CatalogItemEditor;
