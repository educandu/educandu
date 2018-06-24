const React = require('react');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const { Radio, Button } = require('antd');

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

const preferredLanguages = ['de', 'en'];

class SectionEditor extends React.Component {
  constructor(props) {
    super(props);

    autoBind.react(this);

    this.state = {
      mode: 'edit'
    };
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

  handleSectionDeleteClick() {
    const { onSectionDeleted, section } = this.props;
    onSectionDeleted(section.key);
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
          <div className="Panel-header" style={{ display: 'flex' }}>
            <div style={{ flex: '1 0 0%' }}>
              <span>Section Key:</span> <b>{section.key}</b>
              <span>&nbsp;&nbsp;&nbsp;</span>
              <span>Revision:</span> <b>{section.order}</b>
              <span>&nbsp;&nbsp;&nbsp;</span>
              <span>Type:</span> <b>{section.type}</b>
            </div>
            <div style={{ flex: 'none' }}>
              <Button
                size="small"
                type="danger"
                onClick={this.handleSectionDeleteClick}
                >
                Abschnitt löschen
              </Button>
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
              <RadioButton value="edit">Bearbeiten</RadioButton>
              <RadioButton value="preview">Vorschau</RadioButton>
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
  onSectionDeleted: PropTypes.func.isRequired,
  section: PropTypes.shape({
    key: PropTypes.string.isRequired,
    order: PropTypes.number,
    type: PropTypes.string.isRequired
  }).isRequired
};

module.exports = SectionEditor;
