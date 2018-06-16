const DocumentApiClient = require('../../services/document-api-client');
const EditorFactory = require('../../plugins/editor-factory');
const SectionEditor = require('./../section-editor.jsx');
const { inject } = require('../container-context.jsx');
const PageHeader = require('./../page-header.jsx');
const PropTypes = require('prop-types');
const React = require('react');

class Editor extends React.Component {
  constructor(props) {
    super(props);

    const { editorFactory, documentApiClient, initialState } = this.props;

    this.editorFactory = editorFactory;
    this.documentApiClient = documentApiClient;

    this.state = {
      ...this.createStateFromDoc(initialState),
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
        title: editedDoc.title
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
    window.location = `/docs/${result._id}`;
  }

  render() {
    const { originalDoc, sectionInfos, isDirty } = this.state;
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
          {isDirty && <a onClick={this.handleSave}>Übernehmen</a>}
          &nbsp;
          <a href={`/docs/${originalDoc._id}`}>Abbrechen</a>
        </PageHeader>
        <div>
          {children}
        </div>
      </React.Fragment>
    );
  }
}

Editor.propTypes = {
  documentApiClient: PropTypes.instanceOf(DocumentApiClient).isRequired,
  editorFactory: PropTypes.instanceOf(EditorFactory).isRequired,
  initialState: PropTypes.shape({
    sections: PropTypes.arrayOf(PropTypes.shape({
      key: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired
    }))
  }).isRequired
};

module.exports = inject({
  documentApiClient: DocumentApiClient,
  editorFactory: EditorFactory
}, Editor);
