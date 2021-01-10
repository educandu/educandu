import React from 'react';
import autoBind from 'auto-bind';
import urls from '../utils/urls';
import PropTypes from 'prop-types';
import { Input, Radio } from 'antd';
import { inject } from './container-context';
import LanguageSelect from './language-select';
import { withTranslation } from 'react-i18next';
import { withLanguage } from './language-context';
import CountryFlagAndName from './country-flag-and-name';
import { EyeOutlined, EditOutlined } from '@ant-design/icons';
import LanguageNameProvider from '../data/language-name-provider';
import { documentRevisionShape, translationProps, languageProps } from '../ui/default-prop-types';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

const MODE_EDIT = 'edit';
const MODE_PREVIEW = 'preview';

class DocumentMetadataEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
    this.state = { mode: MODE_PREVIEW };
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
    onChanged({ ...documentRevision, title: event.target.value });
  }

  handleLanguageChange(value) {
    const { onChanged, documentRevision } = this.props;
    onChanged({ ...documentRevision, language: value });
  }

  handleSlugChange(event) {
    const { onChanged, documentRevision } = this.props;
    onChanged({ ...documentRevision, slug: event.target.value });
  }

  render() {
    const { mode } = this.state;
    const { documentRevision, languageNameProvider, language, t } = this.props;

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
  documentRevision: documentRevisionShape.isRequired,
  languageNameProvider: PropTypes.instanceOf(LanguageNameProvider).isRequired,
  onChanged: PropTypes.func.isRequired
};

export default withTranslation('documentMetadataEditor')(withLanguage(inject({
  languageNameProvider: LanguageNameProvider
}, DocumentMetadataEditor)));
