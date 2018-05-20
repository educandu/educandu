const EditorFactory = require('../plugins/editor-factory');
const SectionEditor = require('./section-editor.jsx');
const PageHeader = require('./page-header.jsx');
const { Container } = require('../common/di');
const PropTypes = require('prop-types');
const React = require('react');

/* eslint react/forbid-prop-types: 0 */

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
    order: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired
  }).isRequired
};

class Editor extends React.Component {
  constructor(props) {
    super(props);

    const { container, doc } = this.props;
    const editorFactory = container.get(EditorFactory);

    this.state = {
      container: container,
      doc: doc,
      sectionInfos: doc.sections.map(section => {
        const editorInstance = editorFactory.createEditor(section.type, section);
        const EditorComponent = editorInstance.getEditorComponent();
        const mode = 'display';
        return { section, editorInstance, EditorComponent, mode };
      }),
      changedSections: {},
      isDirty: false
    };

    this.handleSectionSave = this.handleSectionSave.bind(this);
    this.handleEnterEditMode = this.handleEnterEditMode.bind(this);
    this.handleCancelEditMode = this.handleCancelEditMode.bind(this);
    this.handleContentChanged = this.handleContentChanged.bind(this);
  }

  handleContentChanged(sectionId, content) {
    this.setState(prevState => {
      const { doc } = this.props;
      const section = doc.sections.find(s => s._id === sectionId);
      return {
        changedSections: {
          ...prevState.changedSections,
          [sectionId]: { ...section, content }
        },
        isDirty: true
      };
    });
  }

  handleEnterEditMode(sectionId) {
    const { doc } = this.props;
    const section = doc.sections.find(s => s._id === sectionId);
    this.setState(prevState => {
      return {
        ...prevState,
        sectionInfos: prevState.sectionInfos.map(info => info.section === section ? { ...info, mode: 'edit' } : info)
      };
    });
  }

  handleCancelEditMode(sectionId) {
    this.setState(prevState => {
      const { [sectionId]: deletedKey, ...prunedChangedSections } = prevState.changedSections;
      return {
        ...prevState,
        changedSections: prunedChangedSections,
        sectionInfos: prevState.sectionInfos.map(info => info.section._id === sectionId ? { ...info, mode: 'display' } : info)
      };
    });
  }

  handleSectionSave() {
  }

  render() {
    const { sectionInfos } = this.state;
    const children = sectionInfos.map(({ section, editorInstance, EditorComponent, mode }) => (
      <SectionEditor
        key={section._id}
        EditorComponent={EditorComponent}
        editorInstance={editorInstance}
        mode={mode}
        onCancelEditMode={this.handleCancelEditMode}
        onContentChanged={this.handleContentChanged}
        onEnterEditMode={this.handleEnterEditMode}
        onSave={this.handleSectionSave}
        section={section}
        />
    ));
    return (
      <React.Fragment>
        <PageHeader />
        <div>
          {children}
        </div>
      </React.Fragment>
    );
  }
}

Editor.propTypes = {
  container: PropTypes.instanceOf(Container).isRequired,
  doc: PropTypes.shape({
    sections: PropTypes.arrayOf(PropTypes.shape({
      _id: PropTypes.string.isRequired,
      content: PropTypes.object,
      order: PropTypes.number.isRequired,
      type: PropTypes.string.isRequired
    }))
  }).isRequired
};

module.exports = Editor;
