import React from 'react';
import Page from '../page';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import urls from '../../utils/urls';
import Logger from '../../common/logger';
import uniqueId from '../../utils/unique-id';
import { inject } from '../container-context';
import SectionEditor from '../section-editor';
import { Menu, Button, Dropdown } from 'antd';
import cloneDeep from '../../utils/clone-deep';
import errorHelper from '../../ui/error-helper';
import pluginInfos from '../../plugins/plugin-infos';
import ShallowUpdateList from '../shallow-update-list';
import EditorFactory from '../../plugins/editor-factory';
import RendererFactory from '../../plugins/renderer-factory';
import DocumentMetadataEditor from '../document-metadata-editor';
import DocumentApiClient from '../../services/document-api-client';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { PlusOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { documentRevisionShape, sectionShape } from '../../ui/default-prop-types';

const logger = new Logger(__filename);

const canReorder = (list, startIndex, endIndex) => {
  return typeof startIndex === 'number'
    && !Number.isNaN(startIndex)
    && startIndex >= 0
    && startIndex < list.length
    && typeof endIndex === 'number'
    && !Number.isNaN(endIndex)
    && endIndex >= 0
    && endIndex < list.length
    && startIndex !== endIndex;
};

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

const addKeyIfNotExists = (arr, key) => {
  return arr.includes(key) ? arr : arr.concat([key]);
};

const removeKeyIfExists = (arr, key) => {
  return arr.includes(key) ? arr.filter(x => x !== key) : arr;
};

class EditDoc extends React.Component {
  constructor(props) {
    super(props);

    autoBind(this);

    const { editorFactory, rendererFactory, documentApiClient, initialState } = this.props;
    const { documentRevision, proposedSections } = initialState;

    this.editorFactory = editorFactory;
    this.rendererFactory = rendererFactory;
    this.documentApiClient = documentApiClient;

    this.state = this.createStateFromDocumentRevision(documentRevision, proposedSections);

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

  createStateFromDocumentRevision(documentRevision, proposedSections = null) {
    let proposedSectionKeys;
    const clonedRevision = cloneDeep(documentRevision);

    if (proposedSections && proposedSections.length) {
      if (!clonedRevision.sections.length) {
        clonedRevision.sections = cloneDeep(proposedSections);
        proposedSectionKeys = clonedRevision.sections.map(s => s.key);
      } else {
        throw new Error('Cloning into a non-empty document is not permitted.');
      }
    } else {
      proposedSectionKeys = [];
    }

    return {
      editedDocumentRevision: clonedRevision,
      isDirty: false,
      proposedSectionKeys: proposedSectionKeys,
      invalidSectionKeys: []
    };
  }

  mergeStateFromNewDocumentRevision(prevState, newDocumentRevision) {
    const updatedRevision = cloneDeep(newDocumentRevision);
    const updatedSections = updatedRevision.sections;
    const existingSections = prevState.editedDocumentRevision.sections;
    const existingSectionKeys = existingSections.map(s => s.key);

    if (updatedSections.some(s => !existingSectionKeys.includes(s.key))) {
      throw new Error('Updated sections do not match exiting sections');
    }

    const proposedSectionKeys = [];
    const mergedSections = existingSections.map(oldSection => {
      const updatedSection = updatedSections.find(s => s.key === oldSection.key);
      if (updatedSection) {
        return updatedSection;
      }

      proposedSectionKeys.push(oldSection.key);
      return oldSection;
    });

    return {
      editedDocumentRevision: {
        ...updatedRevision,
        sections: mergedSections
      },
      isDirty: false,
      proposedSectionKeys: proposedSectionKeys,
      invalidSectionKeys: []
    };
  }

  moveSection(sourceIndex, destinationIndex) {
    const { editedDocumentRevision } = this.state;
    if (canReorder(editedDocumentRevision.sections, sourceIndex, destinationIndex)) {
      this.setState(prevState => ({
        editedDocumentRevision: {
          ...prevState.editedDocumentRevision,
          sections: reorder(prevState.editedDocumentRevision.sections, sourceIndex, destinationIndex)
        },
        isDirty: true
      }));
    }
  }

  handleMetadataChanged(metadata) {
    this.setState(prevState => {
      return {
        editedDocumentRevision: { ...prevState.editedDocumentRevision, ...metadata },
        isDirty: true
      };
    });
  }

  handleContentChanged(sectionKey, content, isInvalid) {
    this.setState(prevState => {
      return {
        editedDocumentRevision: {
          ...prevState.editedDocumentRevision,
          sections: prevState.editedDocumentRevision.sections.map(sec => sec.key === sectionKey ? { ...sec, content } : sec)
        },
        isDirty: true,
        invalidSectionKeys: isInvalid
          ? addKeyIfNotExists(prevState.invalidSectionKeys, sectionKey)
          : removeKeyIfExists(prevState.invalidSectionKeys, sectionKey)
      };
    });
  }

  handleSectionMovedUp(sectionKey) {
    const { editedDocumentRevision } = this.state;
    const sourceIndex = editedDocumentRevision.sections.findIndex(section => section.key === sectionKey);
    const destinationIndex = sourceIndex - 1;
    this.moveSection(sourceIndex, destinationIndex);
  }

  handleSectionMovedDown(sectionKey) {
    const { editedDocumentRevision } = this.state;
    const sourceIndex = editedDocumentRevision.sections.findIndex(section => section.key === sectionKey);
    const destinationIndex = sourceIndex + 1;
    this.moveSection(sourceIndex, destinationIndex);
  }

  handleSectionDeleted(sectionKey) {
    this.setState(prevState => {
      return {
        editedDocumentRevision: {
          ...prevState.editedDocumentRevision,
          sections: prevState.editedDocumentRevision.sections.filter(sec => sec.key !== sectionKey)
        },
        isDirty: true,
        invalidSectionKeys: removeKeyIfExists(prevState.invalidSectionKeys, sectionKey)
      };
    });
  }

  handleNewSectionClick(pluginInfo) {
    const newSection = {
      key: uniqueId.create(),
      revision: null,
      type: pluginInfo.type,
      deletedOn: null,
      deletedBy: null,
      deletedBecause: null,
      content: cloneDeep(pluginInfo.defaultContent)
    };
    this.setState(prevState => {
      return {
        editedDocumentRevision: {
          ...prevState.editedDocumentRevision,
          sections: [...prevState.editedDocumentRevision.sections, newSection]
        },
        isDirty: true
      };
    });
  }

  async handleSaveClick() {
    const { editedDocumentRevision, proposedSectionKeys } = this.state;
    const data = {
      title: editedDocumentRevision.title,
      slug: editedDocumentRevision.slug,
      namespace: editedDocumentRevision.namespace,
      language: editedDocumentRevision.language,
      sections: editedDocumentRevision.sections.filter(s => !proposedSectionKeys.includes(s.key)).map(s => ({
        key: s.key,
        type: s.type,
        content: s.content
      })),
      appendTo: {
        key: editedDocumentRevision.key,
        ancestorId: editedDocumentRevision._id
      }
    };

    try {
      const { documentRevision } = await this.documentApiClient.saveDocument(data);
      this.setState(prevState => this.mergeStateFromNewDocumentRevision(prevState, documentRevision));
    } catch (error) {
      errorHelper.handleApiError(error, logger);
    }
  }

  handleSectionApproved(sectionKey) {
    this.setState(prevState => ({
      editedDocumentRevision: {
        ...prevState.editedDocumentRevision,
        sections: prevState.editedDocumentRevision.sections.map(sec => sec.key === sectionKey ? cloneDeep(sec) : sec)
      },
      proposedSectionKeys: removeKeyIfExists(prevState.proposedSectionKeys, sectionKey),
      isDirty: true
    }));
  }

  handleSectionRefused(sectionKey) {
    this.setState(prevState => ({
      editedDocumentRevision: {
        ...prevState.editedDocumentRevision,
        sections: prevState.editedDocumentRevision.sections.filter(sec => sec.key !== sectionKey)
      },
      proposedSectionKeys: removeKeyIfExists(prevState.proposedSectionKeys, sectionKey)
    }));
  }

  handleBackClick() {
    const { editedDocumentRevision } = this.state;
    window.location = urls.getDocUrl(editedDocumentRevision.key);
  }

  handleDragEnd({ source, destination }) {
    if (destination) {
      this.moveSection(source.index, destination.index);
    }
  }

  render() {
    const { language } = this.props;
    const { editedDocumentRevision, isDirty, invalidSectionKeys, proposedSectionKeys } = this.state;

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
        <Button type="primary" shape="circle" icon={<PlusOutlined />} size="large" />
      </Dropdown>
    );

    const headerActions = [];
    if (isDirty && !invalidSectionKeys.length) {
      headerActions.push({
        key: 'save',
        type: 'primary',
        icon: SaveOutlined,
        text: 'Speichern',
        handleClick: this.handleSaveClick
      });
    }

    headerActions.push({
      key: 'close',
      icon: CloseOutlined,
      text: 'Zurück',
      handleClick: this.handleBackClick
    });

    const alerts = [];
    if (proposedSectionKeys.length) {
      alerts.push({
        message: 'Übernehmen oder verwerfen Sie die vorgeschlagenen Abschnitte. '
          + 'Nicht übernommene Abschnitte sind nur solange sichtbar, bis Sie die Seite verlassen.',
        type: 'info'
      });
    }

    return (
      <Page headerActions={headerActions} customAlerts={alerts}>
        <div className="EditDocPage">
          <div className="EditDocPage-docEditor">
            <DocumentMetadataEditor
              documentRevision={editedDocumentRevision}
              onChanged={this.handleMetadataChanged}
              />
          </div>
          <DragDropContext onDragEnd={this.handleDragEnd}>
            <Droppable droppableId="droppable" ignoreContainerClipping>
              {droppableProvided => (
                <div ref={droppableProvided.innerRef} {...droppableProvided.droppableProps}>
                  <ShallowUpdateList items={editedDocumentRevision.sections}>
                    {(section, index) => (
                      <Draggable key={section.key} draggableId={section.key} index={index}>
                        {(draggableProvided, draggableState) => (
                          <section
                            key={section.key}
                            className="Section"
                            ref={draggableProvided.innerRef}
                            {...draggableProvided.draggableProps}
                            style={{
                              userSelect: draggableState.isDragging ? 'none' : null,
                              ...draggableProvided.draggableProps.style
                            }}
                            >
                            <SectionEditor
                              EditorComponent={this.getEditorComponentForSection(section)}
                              DisplayComponent={this.getDisplayComponentForSection(section)}
                              onContentChanged={this.handleContentChanged}
                              onSectionMovedUp={this.handleSectionMovedUp}
                              onSectionMovedDown={this.handleSectionMovedDown}
                              onSectionDeleted={this.handleSectionDeleted}
                              onSectionApproved={this.handleSectionApproved}
                              onSectionRefused={this.handleSectionRefused}
                              dragHandleProps={draggableProvided.dragHandleProps}
                              isHighlighted={draggableState.isDragging}
                              isInvalid={invalidSectionKeys.includes(section.key)}
                              isProposed={proposedSectionKeys.includes(section.key)}
                              language={language}
                              section={section}
                              documentRevision={editedDocumentRevision}
                              />
                          </section>
                        )}
                      </Draggable>
                    )}
                  </ShallowUpdateList>
                  {droppableProvided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          <aside className="EditDocPage-addSectionButton">
            {newSectionDropdown}
          </aside>
        </div>
      </Page>
    );
  }
}

EditDoc.propTypes = {
  documentApiClient: PropTypes.instanceOf(DocumentApiClient).isRequired,
  editorFactory: PropTypes.instanceOf(EditorFactory).isRequired,
  initialState: PropTypes.shape({
    documentRevision: documentRevisionShape.isRequired,
    proposedSections: PropTypes.arrayOf(sectionShape)
  }).isRequired,
  language: PropTypes.string.isRequired,
  rendererFactory: PropTypes.instanceOf(RendererFactory).isRequired
};

export default inject({
  documentApiClient: DocumentApiClient,
  rendererFactory: RendererFactory,
  editorFactory: EditorFactory
}, EditDoc);
