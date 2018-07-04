const React = require('react');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const utils = require('../../utils/unique-id');
const PageHeader = require('./../page-header.jsx');
const { Menu, Button, Dropdown } = require('antd');
const { inject } = require('../container-context.jsx');
const SectionEditor = require('./../section-editor.jsx');
const EditorFactory = require('../../plugins/editor-factory');
const RendererFactory = require('../../plugins/renderer-factory');
const DocumentApiClient = require('../../services/document-api-client');
const { sortableContainer, sortableElement, arrayMove } = require('react-sortable-hoc');


const pluginInfos = [
  {
    name: 'Markdown',
    type: 'markdown',
    defaultContent: {
      text: ''
    }
  },
  {
    name: 'Image',
    type: 'image',
    defaultContent: {
      type: 'internal',
      url: '',
      maxWidth: 100
    }
  },
  {
    name: 'Audio',
    type: 'audio',
    defaultContent: {
      type: 'internal',
      url: ''
    }
  },
  {
    name: 'Youtube-Video',
    type: 'youtube-video',
    defaultContent: {
      url: '',
      maxWidth: 100
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
      contentId: null,
      maxWidth: 100
    }
  }
];

const SectionItem = sortableElement(({ render, ...rest }) => render({ ...rest }));
const SectionList = sortableContainer(({ render, ...rest }) => render({ ...rest }));

class Edit extends React.Component {
  constructor(props) {
    super(props);

    autoBind.react(this);

    const { editorFactory, rendererFactory, documentApiClient, initialState } = this.props;
    const { doc, sections, language } = initialState;

    this.editorFactory = editorFactory;
    this.rendererFactory = rendererFactory;
    this.documentApiClient = documentApiClient;

    this.state = {
      ...this.createStateFromDoc({ doc, sections }),
      language
    };

    this.pluginInfos = pluginInfos.map(t => ({
      ...t,
      handleNew: this.handleNewSectionClick.bind(this, t)
    }));
  }

  getEditorComponentForSection(section) {
    return this.editorFactory.createEditor(section.type).getEditorComponent();
  }

  getDisplayComponentForSection(section) {
    return this.rendererFactory.createRenderer(section.type).getDisplayComponent();
  }

  createStateFromDoc({ doc, sections }) {
    return {
      originalDoc: doc,
      originalSections: sections,
      editedDoc: JSON.parse(JSON.stringify(doc)),
      editedSections: JSON.parse(JSON.stringify(sections)),
      isDirty: false
    };
  }

  handleContentChanged(sectionKey, content) {
    this.setState(prevState => {
      return {
        editedSections: prevState.editedSections.map(sec => sec.key === sectionKey ? { ...sec, content } : sec),
        isDirty: true
      };
    });
  }

  handleSectionDeleted(sectionKey) {
    this.setState(prevState => {
      return {
        editedSections: prevState.editedSections.filter(sec => sec.key !== sectionKey),
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
      }
    };
    this.setState(prevState => {
      return {
        editedSections: [...prevState.editedSections, newSection],
        isDirty: true
      };
    });
  }

  async handleSave() {
    const { editedDoc, editedSections } = this.state;
    const user = { name: 'Mr. Browser' };
    const payload = {
      doc: {
        key: editedDoc.key,
        title: editedDoc.title
      },
      sections: editedSections.map(section => ({
        ancestorId: section._id,
        key: section.key,
        type: section.type,
        content: section.content
      })),
      user: user
    };
    const { doc, sections } = await this.documentApiClient.saveDocument(payload);
    this.setState(this.createStateFromDoc({ doc, sections }));
  }

  handleSectionSortEnd({ oldIndex, newIndex }) {
    this.setState(prevState => {
      return {
        editedSections: arrayMove(prevState.editedSections, oldIndex, newIndex),
        isDirty: true
      };
    });
  }

  renderSectionList({ sections, language }) {
    return (
      <div>
        {sections.map((section, index) => (
          <SectionItem key={section.key} index={index} section={section} language={language} render={this.renderSection} />
        ))}
      </div>
    );
  }

  renderSection({ section, language }) {
    return (
      <SectionEditor
        key={section.key}
        EditorComponent={this.getEditorComponentForSection(section)}
        DisplayComponent={this.getDisplayComponentForSection(section)}
        onContentChanged={this.handleContentChanged}
        onSectionDeleted={this.handleSectionDeleted}
        language={language}
        section={section}
        />
    );
  }

  render() {
    const { originalDoc, editedSections, isDirty, language } = this.state;

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

    return (
      <React.Fragment>
        <PageHeader>
          {isDirty && <a onClick={this.handleSave}>Speichern</a>}
          &nbsp;
          <a href={`/docs/${originalDoc.key}`}>Zurück</a>
        </PageHeader>
        <div className="PageContent">
          <SectionList
            sections={editedSections}
            language={language}
            render={this.renderSectionList}
            onSortEnd={this.handleSectionSortEnd}
            transitionDuration={800}
            useWindowAsScrollContainer
            useDragHandle
            />
          {newSectionDropdown}
        </div>
      </React.Fragment>
    );
  }
}

Edit.propTypes = {
  documentApiClient: PropTypes.instanceOf(DocumentApiClient).isRequired,
  editorFactory: PropTypes.instanceOf(EditorFactory).isRequired,
  initialState: PropTypes.shape({
    doc: PropTypes.shape({
      key: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired
    }),
    sections: PropTypes.arrayOf(PropTypes.shape({
      key: PropTypes.string.isRequired,
      order: PropTypes.number.isRequired,
      type: PropTypes.string.isRequired,
      content: PropTypes.any.isRequired
    })),
    language: PropTypes.string.isRequired
  }).isRequired,
  rendererFactory: PropTypes.instanceOf(RendererFactory).isRequired
};

module.exports = inject({
  documentApiClient: DocumentApiClient,
  rendererFactory: RendererFactory,
  editorFactory: EditorFactory
}, Edit);
