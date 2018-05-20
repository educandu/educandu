const PropTypes = require('prop-types');
const React = require('react');

/* eslint react/forbid-prop-types: 0 */

const preferredLanguages = ['de', 'en'];

class SectionEditor extends React.Component {
  constructor(props) {
    super(props);
    this.handleEditClick = this.handleEditClick.bind(this);
    this.handleSaveClick = this.handleSaveClick.bind(this);
    this.handleCancelClick = this.handleCancelClick.bind(this);
    this.handleContentChange = this.handleContentChange.bind(this);
  }

  shouldComponentUpdate() {
    return true;
  }

  handleEditClick() {
    const { onEnterEditMode, section } = this.props;
    onEnterEditMode(section._id);
  }

  handleSaveClick() {
    const { onSave, section } = this.props;
    onSave(section._id);
  }

  handleCancelClick() {
    const { onCancelEditMode, section } = this.props;
    onCancelEditMode(section._id);
  }

  handleContentChange(content) {
    const { onContentChanged, section } = this.props;
    onContentChanged(section._id, content);
  }

  render() {
    const { section, editorInstance, EditorComponent, mode } = this.props;
    return (
      <section
        key={section._id}
        className="Section"
        data-section-id={section._id}
        data-section-order={section.order}
        data-section-type={section.type}
        >
        <div>
          <button type="button" onClick={this.handleEditClick}>Edit</button>
          <button type="button" onClick={this.handleCancelClick}>Cancel</button>
          <button type="button" onClick={this.handleSaveClick}>Save</button>
        </div>
        <EditorComponent
          section={section}
          editor={editorInstance}
          mode={mode}
          preferredLanguages={preferredLanguages}
          onContentChanged={this.handleContentChange}
          />
      </section>
    );
  }
}

SectionEditor.propTypes = {
  EditorComponent: PropTypes.func.isRequired,
  editorInstance: PropTypes.object.isRequired,
  mode: PropTypes.string.isRequired,
  onCancelEditMode: PropTypes.func.isRequired,
  onContentChanged: PropTypes.func.isRequired,
  onEnterEditMode: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  section: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    content: PropTypes.object,
    order: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired
  }).isRequired
};

module.exports = SectionEditor;
