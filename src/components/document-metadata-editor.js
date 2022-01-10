import PropTypes from 'prop-types';
import urls from '../utils/urls.js';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { useService } from './container-context.js';
import { useSettings } from './settings-context.js';
import { useLanguage } from './language-context.js';
import { handleApiError } from '../ui/error-helper.js';
import inputValidators from '../utils/input-validators.js';
import { Input, Radio, Tag, Space, Select, Form } from 'antd';
import { EyeOutlined, EditOutlined } from '@ant-design/icons';
import LanguageSelect from './localization/language-select.js';
import { documentRevisionShape } from '../ui/default-prop-types.js';
import LanguageNameProvider from '../data/language-name-provider.js';
import DocumentApiClient from '../api-clients/document-api-client.js';
import CountryFlagAndName from './localization/country-flag-and-name.js';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

const MODE_EDIT = 'edit';
const MODE_PREVIEW = 'preview';

function DocumentMetadataEditor({ documentRevision, onChanged }) {
  const settings = useSettings();
  const { language } = useLanguage();
  const { t } = useTranslation('documentMetadataEditor');
  const documentApiClient = useService(DocumentApiClient);
  const languageNameProvider = useService(LanguageNameProvider);

  const [mode, setMode] = useState(MODE_PREVIEW);
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [slugValidationStatus, setSlugValidationStatus] = useState('');
  const [tagsValidationStatus, setTagsValidationStatus] = useState('');

  const validateMetadata = metadata => {
    const isValidSlug = inputValidators.isValidSlug(metadata.slug);
    setSlugValidationStatus(isValidSlug ? '' : 'warning');

    const areValidTags = metadata.tags.length > 0 && metadata.tags.every(tag => inputValidators.isValidTag({ tag }));
    setTagsValidationStatus(areValidTags ? '' : 'error');

    return areValidTags;
  };

  useEffect(() => {
    validateMetadata(documentRevision);
  }, [documentRevision]);

  const handleModeChange = event => {
    setMode(event.target.value);
  };

  const handleTitleChange = event => {
    onChanged({ metadata: { ...documentRevision, title: event.target.value } });
  };

  const handleLanguageChange = value => {
    onChanged({ metadata: { ...documentRevision, language: value } });
  };

  const handleSlugChange = event => {
    const metadata = { ...documentRevision, slug: event.target.value };
    onChanged({ metadata, invalidMetadata: !validateMetadata(metadata) });
  };

  const handleTagSuggestionsRefresh = async tagSuggestionsQuery => {
    try {
      if (tagSuggestionsQuery.length !== 3) {
        return;
      }
      const newTagSuggestions = await documentApiClient.getRevisionTagSuggestions(tagSuggestionsQuery);
      setTagSuggestions(newTagSuggestions);
    } catch (error) {
      handleApiError({ error, t });
    }
  };

  const handleTagsChange = selectedValues => {
    const metadata = { ...documentRevision, tags: selectedValues };
    onChanged({ metadata, invalidMetadata: !validateMetadata(metadata) });
  };

  const defaultTags = settings?.defaultTags || [];
  const mergedTags = new Set([...defaultTags, ...documentRevision.tags, ...tagSuggestions]);

  const renderComponent = () => {
    const docLanguage = languageNameProvider.getData(language)[documentRevision.language];

    switch (mode) {
      case MODE_PREVIEW:
        return (
          <div>
            <span>{t('common:title')}:</span> <span>{documentRevision.title}</span>
            <br />
            <span>{t('language')}:</span> <span><CountryFlagAndName code={docLanguage.flag} name={docLanguage.name} /></span>
            <br />
            <span>{t('slug')}:</span> {documentRevision.slug ? <span>{urls.getDocUrl(documentRevision.key, documentRevision.slug)}</span> : <i>({t('unassigned')})</i>}
            <br />
            <span>{t('tags')}</span>: {documentRevision.tags.map(item => (<Space key={item}><Tag key={item}>{item}</Tag></Space>))}
          </div>
        );
      case MODE_EDIT:
        return (
          <div>
            <span>{t('common:title')}:</span> <Input value={documentRevision.title} onChange={handleTitleChange} />
            <br />
            <span>{t('language')}:</span> <LanguageSelect value={documentRevision.language} onChange={handleLanguageChange} />
            <br />
            <span>{t('slug')}:</span>
            <Form.Item validateStatus={slugValidationStatus} help={slugValidationStatus && t('common:invalidSlug')}>
              <Input addonBefore={urls.articlesPrefix} value={documentRevision.slug || ''} onChange={handleSlugChange} />
            </Form.Item>
            <span>{t('tags')}</span>:
            <Form.Item validateStatus={tagsValidationStatus} help={tagsValidationStatus && t('invalidTags')}>
              <Select
                mode="tags"
                tokenSeparators={[' ', '\t']}
                value={documentRevision.tags}
                onSearch={handleTagSuggestionsRefresh}
                onChange={selectedValues => handleTagsChange(selectedValues)}
                options={Array.from(mergedTags).map(tag => ({ value: tag, key: tag }))}
                />
            </Form.Item>
          </div>
        );
      default:
        throw new Error(`Unsupported mode '${mode}'`);
    }
  };

  return (
    <div className="Panel">
      <div className="Panel-header">
        {t('header')}
      </div>
      <div className="Panel-content">
        {renderComponent()}
      </div>
      <div className="Panel-footer">
        <RadioGroup size="small" value={mode} onChange={handleModeChange}>
          <RadioButton value={MODE_PREVIEW}>
            <EyeOutlined />&nbsp;{t('common:preview')}
          </RadioButton>
          <RadioButton value={MODE_EDIT}>
            <EditOutlined />&nbsp;{t('common:edit')}
          </RadioButton>
        </RadioGroup>
      </div>
    </div>
  );
}

DocumentMetadataEditor.propTypes = {
  documentRevision: documentRevisionShape.isRequired,
  onChanged: PropTypes.func.isRequired
};

export default DocumentMetadataEditor;
