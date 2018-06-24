const DocumentApiClient = require('../../services/document-api-client');
const EditorFactory = require('../../plugins/editor-factory');
const SectionEditor = require('./../section-editor.jsx');
const { inject } = require('../container-context.jsx');
const PageHeader = require('./../page-header.jsx');
const utils = require('../../utils/unique-id');
const Dropdown = require('antd/lib/dropdown');
const Button = require('antd/lib/button');
const PropTypes = require('prop-types');
const Menu = require('antd/lib/menu');
const React = require('react');

const pluginInfos = [
  {
    name: 'Markdown',
    type: 'markdown',
    defaultContent: ''
  },
  {
    name: 'Image',
    type: 'image',
    defaultContent: {
      src: {
        type: 'internal',
        url: ''
      }
    }
  },
  {
    name: 'Audio',
    type: 'audio',
    defaultContent: {
      src: {
        type: 'internal',
        url: ''
      }
    }
  },
  {
    name: 'Youtube-Video',
    type: 'youtube-video',
    defaultContent: {
      url: '',
      maxWidth: 75
    }
  },
  {
    name: 'Quick-Tester',
    type: 'quick-tester',
    defaultContent: {
      name: '',
      teaser: '',
      tests: []
    }
  },
  {
    name: 'H5P-Player',
    type: 'h5p-player',
    defaultContent: {
      contentId: null
    }
  }
];

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
    this.handleNewSectionClick = this.handleNewSectionClick.bind(this);

    this.pluginInfos = pluginInfos.map(t => ({
      ...t,
      handleNew: this.handleNewSectionClick.bind(this, t)
    }));
  }

  createSectionInfoFromSection(section) {
    const editorInstance = this.editorFactory.createEditor(section.type, section);
    const EditorComponent = editorInstance.getEditorComponent();
    return { section, editorInstance, EditorComponent };
  }

  createStateFromDoc(doc) {
    return {
      originalDoc: doc,
      editedDoc: JSON.parse(JSON.stringify(doc)),
      sectionInfos: doc.sections.map(section => this.createSectionInfoFromSection(section))
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

  handleNewSectionClick(pluginInfo) {
    const newSection = {
      _id: null,
      key: utils.create(),
      order: null,
      type: pluginInfo.type,
      content: {
        de: JSON.parse(JSON.stringify(pluginInfo.defaultContent))
      },
      updatedContent: {
        de: JSON.parse(JSON.stringify(pluginInfo.defaultContent))
      }
    };
    this.setState(prevState => {
      return {
        editedDoc: {
          ...prevState.editedDoc,
          sections: [...prevState.editedDoc.sections, newSection]
        },
        sectionInfos: [...prevState.sectionInfos, this.createSectionInfoFromSection(newSection)],
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

    const newSectionMenu = (
      <Menu>
        {this.pluginInfos.map(pt => (
          <Menu.Item key={pt.type}>
            <a rel="noopener noreferrer" onClick={pt.handleNew}>{pt.name}</a>
          </Menu.Item>
        ))}
      </Menu>
    );

    const newSectionDropdown = (
      <Dropdown key="new-section-dropdown" overlay={newSectionMenu} placement="topCenter">
        <Button type="primary" shape="circle" icon="plus" size="large" />
      </Dropdown>
    );

    children.push(newSectionDropdown);

    return (
      <React.Fragment>
        <PageHeader>
          {isDirty && <a onClick={this.handleSave}>Übernehmen</a>}
          &nbsp;
          <a href={`/docs/${originalDoc._id}`}>Abbrechen</a>
        </PageHeader>
        <div className="PageContent">
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
