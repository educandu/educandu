const React = require('react');
const autoBind = require('auto-bind');
const urls = require('../utils/urls');
const PropTypes = require('prop-types');
const { Input, Radio } = require('antd');
const { docShape } = require('../ui/default-prop-types');
const { EyeOutlined, EditOutlined } = require('@ant-design/icons');

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

class DocEditor extends React.Component {
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
    const { onChanged, doc } = this.props;
    onChanged({ title: event.target.value, slug: doc.slug });
  }

  handleSlugChange(event) {
    const { onChanged, doc } = this.props;
    onChanged({ title: doc.title, slug: event.target.value });
  }

  render() {
    const { mode } = this.state;
    const { doc } = this.props;

    let componentToShow;
    switch (mode) {
      case 'preview':
        componentToShow = (
          <div>
            <span>Titel:</span> <span>{doc.title}</span>
            <br />
            <span>URL-Pfad:</span> {doc.slug ? <span>{urls.getArticleUrl(doc.slug)}</span> : <i>(nicht zugewiesen)</i>}
          </div>
        );
        break;
      case 'edit':
        componentToShow = (
          <div>
            <span>Titel:</span> <Input value={doc.title} onChange={this.handleTitleChange} />
            <br />
            <span>URL-Pfad:</span> <Input addonBefore={urls.articlesPrefix} value={doc.slug || ''} onChange={this.handleSlugChange} />
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

DocEditor.propTypes = {
  doc: docShape.isRequired,
  onChanged: PropTypes.func.isRequired
};

module.exports = DocEditor;
