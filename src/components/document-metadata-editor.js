import React from 'react';
import urls from '../utils/urls';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import { Input, Radio, Tag, Space, Select, Form } from 'antd';
import { inject } from './container-context';
import { withTranslation } from 'react-i18next';
import { withSettings } from './settings-context';
import { withLanguage } from './language-context';
import LanguageSelect from './localization/language-select';
import { EyeOutlined, EditOutlined } from '@ant-design/icons';
import LanguageNameProvider from '../data/language-name-provider';
import CountryFlagAndName from './localization/country-flag-and-name';
import { documentRevisionShape, translationProps, languageProps, settingsProps } from '../ui/default-prop-types';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

const MODE_EDIT = 'edit';
const MODE_PREVIEW = 'preview';

class DocumentMetadataEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
    this.state = { mode: MODE_PREVIEW, tagsValidationStatus: '' };
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

  handleTagsChange(selectedValue) {
    const { onChanged, documentRevision } = this.props;
    const invalidMetadata = selectedValue.length === 0 || selectedValue.some(tag => tag.length < 3 || tag.length > 30);
    this.setState({ tagsValidationStatus: invalidMetadata ? 'error' : '' });
    onChanged({ metadata: { ...documentRevision, tags: selectedValue }, invalidMetadata });
  }

  render() {
    const { mode, tagsValidationStatus } = this.state;
    const { documentRevision, languageNameProvider, language, t, settings } = this.props;

    const mergedTags = new Set(settings.defaultTags);
    documentRevision.tags.forEach(tag => mergedTags.add(tag));

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
                tokenSeparators={[' ', '  ']}
                value={documentRevision.tags}
                style={{ width: '100%' }}
                placeholder="Tags Mode"
                onChange={selectedValue => this.handleTagsChange(selectedValue)}
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
  documentRevision: documentRevisionShape.isRequired,
  languageNameProvider: PropTypes.instanceOf(LanguageNameProvider).isRequired,
  onChanged: PropTypes.func.isRequired
};

export default withTranslation('documentMetadataEditor')(withSettings(withLanguage(inject({
  languageNameProvider: LanguageNameProvider
}, DocumentMetadataEditor))));
