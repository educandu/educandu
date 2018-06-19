const PropTypes = require('prop-types');
const Radio = require('antd/lib/radio');
const React = require('react');

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

const preferredLanguages = ['de', 'en'];

class SectionEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      mode: 'preview'
    };

    this.handleEditClick = this.handleEditClick.bind(this);
    this.handleModeChange = this.handleModeChange.bind(this);
    this.handlePreviewClick = this.handlePreviewClick.bind(this);
    this.handleContentChange = this.handleContentChange.bind(this);
  }

  shouldComponentUpdate() {
    return true;
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

  handleContentChange(content) {
    const { onContentChanged, section } = this.props;
    onContentChanged(section.key, content);
  }

  render() {
    const { mode } = this.state;
    const { section, editorInstance, EditorComponent } = this.props;
    return (
      <section key={section.key} className="Section">
        <div className="Panel">
          <div className="Panel-header">
            <div>
              <span>Section Key:</span> <b>{section.key}</b>
              <span>&nbsp;&nbsp;&nbsp;</span>
              <span>Revision:</span> <b>{section.order}</b>
              <span>&nbsp;&nbsp;&nbsp;</span>
              <span>Type:</span> <b>{section.type}</b>
            </div>
          </div>
          <div className="Panel-content">
            <EditorComponent
              section={section}
              editor={editorInstance}
              mode={mode}
              preferredLanguages={preferredLanguages}
              onContentChanged={this.handleContentChange}
              />
          </div>
          <div className="Panel-footer">
            <RadioGroup value={mode} onChange={this.handleModeChange}>
              <RadioButton value="preview">Vorschau</RadioButton>
              <RadioButton value="edit">Bearbeiten</RadioButton>
            </RadioGroup>
          </div>
        </div>
      </section>
    );
  }
}

SectionEditor.propTypes = {
  EditorComponent: PropTypes.func.isRequired,
  editorInstance: PropTypes.shape({
    getEditorComponent: PropTypes.func.isRequired
  }).isRequired,
  onContentChanged: PropTypes.func.isRequired,
  section: PropTypes.shape({
    key: PropTypes.string.isRequired,
    order: PropTypes.number,
    type: PropTypes.string.isRequired
  }).isRequired
};

module.exports = SectionEditor;
