const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const preferredLanguages = ['de', 'en'];

class SectionEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      mode: 'preview'
    };

    this.handleEditClick = this.handleEditClick.bind(this);
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

  handleContentChange(content) {
    const { onContentChanged, section } = this.props;
    onContentChanged(section.key, content);
  }

  render() {
    const { mode } = this.state;
    const { section, editorInstance, EditorComponent } = this.props;
    return (
      <section
        key={section.key}
        className={classNames('Section', { 'Section-display': mode === 'preview', 'Section-edit': mode === 'edit' })}
        data-section-key={section.key}
        data-section-order={section.order}
        data-section-type={section.type}
        >
        <div>
          <button type="button" onClick={this.handleEditClick}>Edit</button>
          <button type="button" onClick={this.handlePreviewClick}>Preview</button>
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
  editorInstance: PropTypes.shape({
    getEditorComponent: PropTypes.func.isRequired
  }).isRequired,
  onContentChanged: PropTypes.func.isRequired,
  section: PropTypes.shape({
    key: PropTypes.string.isRequired,
    order: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired
  }).isRequired
};

module.exports = SectionEditor;
