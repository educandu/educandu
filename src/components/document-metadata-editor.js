import React from 'react';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import urls from '../utils/urls.js';
import { inject } from './container-context.js';
import { withTranslation } from 'react-i18next';
import { withSettings } from './settings-context.js';
import { withLanguage } from './language-context.js';
import validators from '../utils/input-validators.js';
import { Input, Radio, Tag, Space, Select, Form } from 'antd';
import { EyeOutlined, EditOutlined } from '@ant-design/icons';
import LanguageSelect from './localization/language-select.js';
import LanguageNameProvider from '../data/language-name-provider.js';
import CountryFlagAndName from './localization/country-flag-and-name.js';
import { documentRevisionShape, translationProps, languageProps, settingsProps } from '../ui/default-prop-types.js';
import DocumentApiClient from '../services/document-api-client.js';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

const MODE_EDIT = 'edit';
const MODE_PREVIEW = 'preview';

const { isValidTag } = validators;

class DocumentMetadataEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
    this.documentApiClient = props.documentApiClient;
    const { documentRevision } = props;
    this.state = {
      mode: MODE_PREVIEW,
      tagsValidationStatus: documentRevision.tags.length ? '' : 'error',
      tagSuggestions: []
    };
  }

  handleEditClick() {
    this.setState({ mode: MODE_EDIT });
  }

  handlePreviewClick() {
    this.setState({ mode: MODE_PREVIEW });
  }

  handleModeChange(event) {
    this.setState({ mode: event.target.value });
  }

  handleTitleChange(event) {
    const { onChanged, documentRevision } = this.props;
    onChanged({ metadata: { ...documentRevision, title: event.target.value } });
  }

  handleLanguageChange(value) {
    const { onChanged, documentRevision } = this.props;
    onChanged({ metadata: { ...documentRevision, language: value } });
  }

  handleSlugChange(event) {
    const { onChanged, documentRevision } = this.props;
    onChanged({ metadata: { ...documentRevision, slug: event.target.value } });
  }

  async handleTagSuggestionsRefresh(tagSuggestionsQuery) {
    const tagSuggestions = await this.documentApiClient.getRevisionTagSuggestions(tagSuggestionsQuery);
    this.setState({ tagSuggestions });
  }

  handleTagsChange(selectedValues) {
    const { onChanged, documentRevision } = this.props;
    const areTagsValid = selectedValues.length > 0 && selectedValues.every(tag => isValidTag({ tag }));
    this.setState({
      tagsValidationStatus: areTagsValid ? '' : 'error',
      tagSuggestions: []
    });
    onChanged({ metadata: { ...documentRevision, tags: selectedValues }, invalidMetadata: !areTagsValid });
  }

  render() {
    const { mode, tagsValidationStatus, tagSuggestions } = this.state;
    const { documentRevision, languageNameProvider, language, t, settings } = this.props;

    const mergedTags = new Set([...settings.defaultTags, ...documentRevision.tags, ...tagSuggestions]);

    let docLanguage;
    let componentToShow;
    switch (mode) {
      case MODE_PREVIEW:
        docLanguage = languageNameProvider.getData(language)[documentRevision.language];
        componentToShow = (
          <div>
            <span>{t('title')}:</span> <span>{documentRevision.title}</span>
            <br />
            <span>{t('language')}:</span> <span><CountryFlagAndName code={docLanguage.flag} name={docLanguage.name} /></span>
            <br />
            <span>{t('slug')}:</span> {documentRevision.slug ? <span>{urls.getArticleUrl(documentRevision.slug)}</span> : <i>({t('unassigned')})</i>}
            <br />
            <span>{t('tags')}</span>: {documentRevision.tags.map(item => (<Space key={item}><Tag key={item}>{item}</Tag></Space>))}
          </div>
        );
        break;
      case MODE_EDIT:
        docLanguage = null;
        componentToShow = (
          <div>
            <span>{t('title')}:</span> <Input value={documentRevision.title} onChange={this.handleTitleChange} />
            <br />
            <span>{t('language')}:</span> <LanguageSelect value={documentRevision.language} onChange={this.handleLanguageChange} />
            <br />
            <span>{t('slug')}:</span> <Input addonBefore={urls.articlesPrefix} value={documentRevision.slug || ''} onChange={this.handleSlugChange} />
            <span>{t('tags')}</span>:
            <Form.Item validateStatus={tagsValidationStatus} help={tagsValidationStatus && t('invalidTags')}>
              <Select
                mode="tags"
                tokenSeparators={[' ', '\t']}
                value={documentRevision.tags}
                onSearch={value => {
                  if (value.length === 3) {
                    this.handleTagSuggestionsRefresh(value);
                  }
                }}
                onChange={selectedValues => this.handleTagsChange(selectedValues)}
                options={Array.from(mergedTags).map(tag => ({ value: tag, key: tag }))}
                />
            </Form.Item>
          </div>
        );
        break;
      default:
        throw new Error(`Unsupported mode '${mode}'`);
    }

    return (
      <div className="Panel">
        <div className="Panel-header">
          {t('header')}
        </div>
        <div className="Panel-content">
          {componentToShow}
        </div>
        <div className="Panel-footer">
          <RadioGroup size="small" value={mode} onChange={this.handleModeChange}>
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
}

DocumentMetadataEditor.propTypes = {
  ...translationProps,
  ...languageProps,
  ...settingsProps,
  documentApiClient: PropTypes.instanceOf(DocumentApiClient).isRequired,
  documentRevision: documentRevisionShape.isRequired,
  languageNameProvider: PropTypes.instanceOf(LanguageNameProvider).isRequired,
  onChanged: PropTypes.func.isRequired
};

export default withTranslation('documentMetadataEditor')(withSettings(withLanguage(inject({
  languageNameProvider: LanguageNameProvider,
  documentApiClient: DocumentApiClient
}, DocumentMetadataEditor))));
