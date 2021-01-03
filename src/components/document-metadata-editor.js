import React from 'react';
import autoBind from 'auto-bind';
import urls from '../utils/urls';
import PropTypes from 'prop-types';
import { Input, Radio } from 'antd';
import { EyeOutlined, EditOutlined } from '@ant-design/icons';
import { documentRevisionShape } from '../ui/default-prop-types';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

class DocumentMetadataEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
    this.state = { mode: 'preview' };
  }

  handleEditClick() {
    this.setState({ mode: 'edit' });
  }

  handlePreviewClick() {
    this.setState({ mode: 'preview' });
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
    const { documentRevision } = this.props;

    let componentToShow;
    switch (mode) {
      case 'preview':
        componentToShow = (
          <div>
            <span>Titel:</span> <span>{documentRevision.title}</span>
            <br />
            <span>URL-Pfad:</span> {documentRevision.slug ? <span>{urls.getArticleUrl(documentRevision.slug)}</span> : <i>(nicht zugewiesen)</i>}
          </div>
        );
        break;
      case 'edit':
        componentToShow = (
          <div>
            <span>Titel:</span> <Input value={documentRevision.title} onChange={this.handleTitleChange} />
            <br />
            <span>URL-Pfad:</span> <Input addonBefore={urls.articlesPrefix} value={documentRevision.slug || ''} onChange={this.handleSlugChange} />
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
          Metadaten
        </div>
        <div className="Panel-content">
          {componentToShow}
        </div>
        <div className="Panel-footer">
          <RadioGroup size="small" value={mode} onChange={this.handleModeChange}>
            <RadioButton value="preview">
              <EyeOutlined />&nbsp;Vorschau
            </RadioButton>
            <RadioButton value="edit">
              <EditOutlined />&nbsp;Bearbeiten
            </RadioButton>
          </RadioGroup>
        </div>
      </div>
    );
  }
}

DocumentMetadataEditor.propTypes = {
  documentRevision: documentRevisionShape.isRequired,
  onChanged: PropTypes.func.isRequired
};

export default DocumentMetadataEditor;
