const DocumentApiClient = require('../services/document-api-client');
const EditorFactory = require('../plugins/editor-factory');
const SectionEditor = require('./section-editor.jsx');
const PageHeader = require('./page-header.jsx');
const { Container } = require('../common/di');
const PropTypes = require('prop-types');
const React = require('react');

/* eslint no-warning-comments: 0 */
/* eslint react/forbid-prop-types: 0 */

class Editor extends React.Component {
  constructor(props) {
    super(props);

    const { container, doc } = this.props;

    this.editorFactory = container.get(EditorFactory);
    this.documentApiClient = container.get(DocumentApiClient);

    this.state = {
      container: container,
      ...this.createStateFromDoc(doc),
      isDirty: false
    };

    this.handleSave = this.handleSave.bind(this);
    this.handleContentChanged = this.handleContentChanged.bind(this);
  }

  createStateFromDoc(doc) {
    return {
      originalDoc: doc,
      editedDoc: JSON.parse(JSON.stringify(doc)),
      sectionInfos: doc.sections.map(section => {
        const editorInstance = this.editorFactory.createEditor(section.type, section);
        const EditorComponent = editorInstance.getEditorComponent();
        return { section, editorInstance, EditorComponent };
      })
    };
  }

  handleContentChanged(sectionKey, updatedContent) {
    this.setState(prevState => {
      return {
        ...prevState, // TODO Do we need this?
        editedDoc: {
          ...prevState.editedDoc,
          sections: prevState.editedDoc.sections.map(sec => sec.key === sectionKey ? { ...sec, updatedContent } : sec)
        },
        isDirty: true
      };
    });
  }

  async handleSave() {
    const { editedDoc } = this.state;
    const user = { name: 'Mr. Browser' };
    const payload = {
      doc: {
        key: editedDoc._id,
        title: editedDoc.title // TODO Make update-able
      },
      sections: editedDoc.sections.map(section => ({
        _id: section._id,
        key: section.key,
        type: section.type,
        updatedContent: section.updatedContent
      })),
      user: user
    };
    const result = await this.documentApiClient.saveDocument(payload);
    this.setState({ ...this.createStateFromDoc(result), isDirty: false });
  }

  render() {
    const { sectionInfos, isDirty } = this.state;
    const children = sectionInfos.map(({ section, editorInstance, EditorComponent }) => (
      <SectionEditor
        key={section.key}
        EditorComponent={EditorComponent}
        editorInstance={editorInstance}
        onContentChanged={this.handleContentChanged}
        section={section}
        />
    ));
    return (
      <React.Fragment>
        <PageHeader>
          {isDirty && <a onClick={this.handleSave}>Save</a>}
          &nbsp;
          <a>Cancel</a>
        </PageHeader>
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
      key: PropTypes.string.isRequired,
      content: PropTypes.object,
      order: PropTypes.number.isRequired,
      type: PropTypes.string.isRequired
    }))
  }).isRequired
};

module.exports = Editor;
