import React from 'react';
import autoBind from 'auto-bind';
import urls from '../utils/urls';
import PropTypes from 'prop-types';
import { Input, Radio } from 'antd';
import { withTranslation } from 'react-i18next';
import { EyeOutlined, EditOutlined } from '@ant-design/icons';
import { documentRevisionShape, translationProps } from '../ui/default-prop-types';

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
    onChanged({ title: event.target.value, slug: documentRevision.slug });
  }

  handleSlugChange(event) {
    const { onChanged, documentRevision } = this.props;
    onChanged({ title: documentRevision.title, slug: event.target.value });
  }

  render() {
    const { mode } = this.state;
    const { documentRevision, t } = this.props;

    let componentToShow;
    switch (mode) {
      case MODE_PREVIEW:
        componentToShow = (
          <div>
            <span>{t('title')}:</span> <span>{documentRevision.title}</span>
            <br />
            <span>{t('slug')}:</span> {documentRevision.slug ? <span>{urls.getArticleUrl(documentRevision.slug)}</span> : <i>({t('unassigned')})</i>}
          </div>
        );
        break;
      case MODE_EDIT:
        componentToShow = (
          <div>
            <span>{t('title')}:</span> <Input value={documentRevision.title} onChange={this.handleTitleChange} />
            <br />
            <span>{t('slug')}:</span> <Input addonBefore={urls.articlesPrefix} value={documentRevision.slug || ''} onChange={this.handleSlugChange} />
          </div>
        );
        break;
      default:
        componentToShow = null;
        break;
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
  documentRevision: documentRevisionShape.isRequired,
  onChanged: PropTypes.func.isRequired
};

export default withTranslation('documentMetadataEditor')(DocumentMetadataEditor);
