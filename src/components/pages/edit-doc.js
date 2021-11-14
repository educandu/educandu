import React from 'react';
import Page from '../page.js';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import urls from '../../utils/urls.js';
import Logger from '../../common/logger.js';
import { Menu, Button, Dropdown } from 'antd';
import uniqueId from '../../utils/unique-id.js';
import { withTranslation } from 'react-i18next';
import { inject } from '../container-context.js';
import SectionEditor from '../section-editor.js';
import cloneDeep from '../../utils/clone-deep.js';
import errorHelper from '../../ui/error-helper.js';
import pluginInfos from '../../plugins/plugin-infos.js';
import ShallowUpdateList from '../shallow-update-list.js';
import DocumentMetadataEditor from '../document-metadata-editor.js';
import DocumentApiClient from '../../services/document-api-client.js';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { PlusOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { documentRevisionShape, sectionShape, translationProps } from '../../ui/default-prop-types.js';

const logger = new Logger(import.meta.url);

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

    const { initialState } = this.props;
    const { documentRevision, proposedSections } = initialState;

    this.state = this.createStateFromDocumentRevision(documentRevision, proposedSections);

    this.availablePlugins = pluginInfos.map(info => ({
      info,
      handleNew: this.handleNewSectionClick.bind(this, info)
    }));
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
      proposedSectionKeys,
      invalidSectionKeys: [],
      invalidMetadata: false
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
      ...prevState,
      editedDocumentRevision: {
        ...updatedRevision,
        sections: mergedSections
      },
      isDirty: false,
      proposedSectionKeys,
      invalidSectionKeys: []
    };
  }

  moveSection(sourceIndex, destinationIndex) {
    const { editedDocumentRevision } = this.state;
    if (canReorder(editedDocumentRevision.sections, sourceIndex, destinationIndex)) {
      this.setState(prevState => ({
        ...prevState,
        editedDocumentRevision: {
          ...prevState.editedDocumentRevision,
          sections: reorder(prevState.editedDocumentRevision.sections, sourceIndex, destinationIndex)
        },
        isDirty: true
      }));
    }
  }

  handleMetadataChanged({ metadata, invalidMetadata }) {
    this.setState(prevState => {
      return {
        ...prevState,
        invalidMetadata,
        editedDocumentRevision: { ...prevState.editedDocumentRevision, ...metadata },
        isDirty: true
      };
    });
  }

  handleContentChanged(sectionKey, content, isInvalid) {
    this.setState(prevState => {
      return {
        ...prevState,
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
        ...prevState,
        editedDocumentRevision: {
          ...prevState.editedDocumentRevision,
          sections: prevState.editedDocumentRevision.sections.filter(sec => sec.key !== sectionKey)
        },
        isDirty: true,
        invalidSectionKeys: removeKeyIfExists(prevState.invalidSectionKeys, sectionKey)
      };
    });
  }

  cloneSection(section) {
    const info = pluginInfos.find(i => i.type === section.type);
    return {
      key: uniqueId.create(),
      revision: null,
      type: info.type,
      deletedOn: null,
      deletedBy: null,
      deletedBecause: null,
      content: info.cloneContent(section.content)
    };
  }

  duplicateSectionInCollection(allSections, sectionKey) {
    return allSections.reduce((all, current) => {
      all.push(current);
      if (current.key === sectionKey) {
        all.push(this.cloneSection(current));
      }
      return all;
    }, []);
  }

  handleSectionDuplicated(sectionKey) {
    this.setState(prevState => {
      const newSections = this.duplicateSectionInCollection(prevState.editedDocumentRevision.sections, sectionKey);

      return {
        ...prevState,
        editedDocumentRevision: {
          ...prevState.editedDocumentRevision,
          sections: newSections
        },
        isDirty: true,
        invalidSectionKeys: removeKeyIfExists(prevState.invalidSectionKeys, sectionKey)
      };
    });
  }

  handleNewSectionClick(pluginInfo) {
    const { t } = this.props;
    const newSection = {
      key: uniqueId.create(),
      revision: null,
      type: pluginInfo.type,
      deletedOn: null,
      deletedBy: null,
      deletedBecause: null,
      content: pluginInfo.getDefaultContent(t)
    };
    this.setState(prevState => {
      return {
        ...prevState,
        editedDocumentRevision: {
          ...prevState.editedDocumentRevision,
          sections: [...prevState.editedDocumentRevision.sections, newSection]
        },
        isDirty: true
      };
    });
  }

  async handleSaveClick() {
    const { t } = this.props;
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
      },
      tags: editedDocumentRevision.tags
    };

    try {
      const { documentApiClient } = this.props;
      const { documentRevision } = await documentApiClient.saveDocument(data);
      this.setState(prevState => this.mergeStateFromNewDocumentRevision(prevState, documentRevision));
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
    }
  }

  handleSectionApproved(sectionKey) {
    this.setState(prevState => ({
      ...prevState,
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
      ...prevState,
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
    const { t } = this.props;
    const { editedDocumentRevision, isDirty, invalidSectionKeys, proposedSectionKeys, invalidMetadata } = this.state;

    const newSectionMenu = (
      <Menu>
        {this.availablePlugins.map(({ info, handleNew }) => (
          <Menu.Item key={info.type}>
            <a rel="noopener noreferrer" onClick={handleNew}>{info.getName(t)}</a>
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
    if (isDirty && !invalidSectionKeys.length && !invalidMetadata) {
      headerActions.push({
        key: 'save',
        type: 'primary',
        icon: SaveOutlined,
        text: t('common:save'),
        handleClick: this.handleSaveClick
      });
    }

    headerActions.push({
      key: 'back',
      icon: CloseOutlined,
      text: t('common:back'),
      handleClick: this.handleBackClick
    });

    const alerts = [];
    if (proposedSectionKeys.length) {
      alerts.push({
        message: t('proposedSectionsAlert'),
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
                              onContentChanged={this.handleContentChanged}
                              onSectionMovedUp={this.handleSectionMovedUp}
                              onSectionMovedDown={this.handleSectionMovedDown}
                              onSectionDeleted={this.handleSectionDeleted}
                              onSectionDuplicated={this.handleSectionDuplicated}
                              onSectionApproved={this.handleSectionApproved}
                              onSectionRefused={this.handleSectionRefused}
                              dragHandleProps={draggableProvided.dragHandleProps}
                              isHighlighted={draggableState.isDragging}
                              isInvalid={invalidSectionKeys.includes(section.key)}
                              isProposed={proposedSectionKeys.includes(section.key)}
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
  ...translationProps,
  documentApiClient: PropTypes.instanceOf(DocumentApiClient).isRequired,
  initialState: PropTypes.shape({
    documentRevision: documentRevisionShape.isRequired,
    proposedSections: PropTypes.arrayOf(sectionShape)
  }).isRequired
};

export default withTranslation('editDoc')(inject({
  documentApiClient: DocumentApiClient
}, EditDoc));
