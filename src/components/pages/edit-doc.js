import PropTypes from 'prop-types';
import urls from '../../utils/urls.js';
import Logger from '../../common/logger.js';
import { Menu, Button, Dropdown } from 'antd';
import { useTranslation } from 'react-i18next';
import uniqueId from '../../utils/unique-id.js';
import SectionEditor from '../section-editor.js';
import cloneDeep from '../../utils/clone-deep.js';
import errorHelper from '../../ui/error-helper.js';
import React, { useEffect, useState } from 'react';
import { useService } from '../container-context.js';
import { useBeforeunload } from 'react-beforeunload';
import { ALERT_TYPE } from '../../domain/constants.js';
import InfoFactory from '../../plugins/info-factory.js';
import ShallowUpdateList from '../shallow-update-list.js';
import { useGlobalAlerts } from '../../ui/global-alerts.js';
import DocumentMetadataEditor from '../document-metadata-editor.js';
import DocumentApiClient from '../../api-clients/document-api-client.js';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { PlusOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { documentRevisionShape, sectionShape } from '../../ui/default-prop-types.js';

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

function EditDoc({ initialState, PageTemplate }) {
  const globalAlerts = useGlobalAlerts();
  const [alerts, setAlerts] = useState([]);

  const { t } = useTranslation('editDoc');
  const infoFactory = useService(InfoFactory);
  const documentApiClient = useService(DocumentApiClient);

  const createStateFromDocumentRevision = (documentRevision, proposedSections = null) => {
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
  };

  const { documentRevision, proposedSections } = initialState;
  const [state, setState] = useState(createStateFromDocumentRevision(documentRevision, proposedSections));

  const mergeStateFromNewDocumentRevision = (prevState, newDocumentRevision) => {
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
  };

  const moveSection = (sourceIndex, destinationIndex) => {
    const { editedDocumentRevision } = state;
    if (canReorder(editedDocumentRevision.sections, sourceIndex, destinationIndex)) {
      setState(prevState => ({
        ...prevState,
        editedDocumentRevision: {
          ...prevState.editedDocumentRevision,
          sections: reorder(prevState.editedDocumentRevision.sections, sourceIndex, destinationIndex)
        },
        isDirty: true
      }));
    }
  };

  const handleMetadataChanged = ({ metadata, invalidMetadata }) => {
    setState(prevState => ({
      ...prevState,
      invalidMetadata,
      editedDocumentRevision: { ...prevState.editedDocumentRevision, ...metadata },
      isDirty: true
    }));
  };

  const handleContentChanged = (sectionKey, content, isInvalid) => {
    setState(prevState => ({
      ...prevState,
      editedDocumentRevision: {
        ...prevState.editedDocumentRevision,
        sections: prevState.editedDocumentRevision.sections.map(sec => sec.key === sectionKey ? { ...sec, content } : sec)
      },
      isDirty: true,
      invalidSectionKeys: isInvalid
        ? addKeyIfNotExists(prevState.invalidSectionKeys, sectionKey)
        : removeKeyIfExists(prevState.invalidSectionKeys, sectionKey)
    }));
  };

  const handleSectionMovedUp = sectionKey => {
    const sourceIndex = state.editedDocumentRevision.sections.findIndex(section => section.key === sectionKey);
    const destinationIndex = sourceIndex - 1;
    moveSection(sourceIndex, destinationIndex);
  };

  const handleSectionMovedDown = sectionKey => {
    const sourceIndex = state.editedDocumentRevision.sections.findIndex(section => section.key === sectionKey);
    const destinationIndex = sourceIndex + 1;
    moveSection(sourceIndex, destinationIndex);
  };

  const handleSectionDeleted = sectionKey => {
    setState(prevState => ({
      ...prevState,
      editedDocumentRevision: {
        ...prevState.editedDocumentRevision,
        sections: prevState.editedDocumentRevision.sections.filter(sec => sec.key !== sectionKey)
      },
      isDirty: true,
      invalidSectionKeys: removeKeyIfExists(prevState.invalidSectionKeys, sectionKey)
    }));
  };

  const cloneSection = section => {
    const info = infoFactory.createInfo(section.type);
    return {
      key: uniqueId.create(),
      revision: null,
      type: info.type,
      deletedOn: null,
      deletedBy: null,
      deletedBecause: null,
      content: info.cloneContent(section.content)
    };
  };

  const duplicateSectionInCollection = (allSections, sectionKey) => {
    return allSections.reduce((all, current) => {
      all.push(current);
      if (current.key === sectionKey) {
        all.push(cloneSection(current));
      }
      return all;
    }, []);
  };

  const handleSectionDuplicated = sectionKey => {
    setState(prevState => {
      const newSections = duplicateSectionInCollection(prevState.editedDocumentRevision.sections, sectionKey);

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
  };

  const handleNewSectionClick = pluginInfo => {
    const newSection = {
      key: uniqueId.create(),
      revision: null,
      type: pluginInfo.type,
      deletedOn: null,
      deletedBy: null,
      deletedBecause: null,
      content: pluginInfo.getDefaultContent(t)
    };
    setState(prevState => ({
      ...prevState,
      editedDocumentRevision: {
        ...prevState.editedDocumentRevision,
        sections: [...prevState.editedDocumentRevision.sections, newSection]
      },
      isDirty: true
    }));
  };

  const handleSaveClick = async () => {
    const { editedDocumentRevision, proposedSectionKeys } = state;
    const data = {
      title: editedDocumentRevision.title,
      slug: editedDocumentRevision.slug,
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
      const response = await documentApiClient.saveDocument(data);
      setState(prevState => mergeStateFromNewDocumentRevision(prevState, response.documentRevision));
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
    }
  };

  const handleSectionApproved = sectionKey => {
    setState(prevState => ({
      ...prevState,
      editedDocumentRevision: {
        ...prevState.editedDocumentRevision,
        sections: prevState.editedDocumentRevision.sections.map(sec => sec.key === sectionKey ? cloneDeep(sec) : sec)
      },
      proposedSectionKeys: removeKeyIfExists(prevState.proposedSectionKeys, sectionKey),
      isDirty: true
    }));
  };

  const handleSectionRefused = sectionKey => {
    setState(prevState => ({
      ...prevState,
      editedDocumentRevision: {
        ...prevState.editedDocumentRevision,
        sections: prevState.editedDocumentRevision.sections.filter(sec => sec.key !== sectionKey)
      },
      proposedSectionKeys: removeKeyIfExists(prevState.proposedSectionKeys, sectionKey)
    }));
  };

  const handleCancelClick = () => {
    window.location = urls.getDocUrl(state.editedDocumentRevision.key, state.editedDocumentRevision.slug);
  };

  const handleDragEnd = ({ source, destination }) => {
    if (destination) {
      moveSection(source.index, destination.index);
    }
  };

  const availablePlugins = infoFactory.getRegisteredTypes()
    .map(typeName => infoFactory.createInfo(typeName))
    .map(info => ({ info, handleNew: handleNewSectionClick.bind(this, info) }));

  const { editedDocumentRevision, isDirty, invalidSectionKeys, proposedSectionKeys, invalidMetadata } = state;

  const newSectionMenu = (
    <Menu>
      {availablePlugins.map(({ info, handleNew }) => (
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
      handleClick: handleSaveClick
    });
  }

  headerActions.push({
    key: 'cancel',
    icon: CloseOutlined,
    text: t('common:cancel'),
    handleClick: handleCancelClick
  });

  useEffect(() => {
    const newAlerts = [...globalAlerts];

    if (initialState.proposedSections?.length) {
      newAlerts.push({
        message: t('proposedSectionsAlert'),
        type: ALERT_TYPE.info,
        showInFullScreen: false
      });
    }

    setAlerts(newAlerts);
  }, [globalAlerts, initialState.proposedSections, t]);

  useBeforeunload(event => {
    if (isDirty) {
      event.preventDefault();
    }
  });

  return (
    <PageTemplate headerActions={headerActions} alerts={alerts}>
      <div className="EditDocPage">
        <div className="EditDocPage-docEditor">
          <DocumentMetadataEditor
            documentRevision={editedDocumentRevision}
            onChanged={handleMetadataChanged}
            />
        </div>
        <DragDropContext onDragEnd={handleDragEnd}>
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
                            onContentChanged={handleContentChanged}
                            onSectionMovedUp={handleSectionMovedUp}
                            onSectionMovedDown={handleSectionMovedDown}
                            onSectionDeleted={handleSectionDeleted}
                            onSectionDuplicated={handleSectionDuplicated}
                            onSectionApproved={handleSectionApproved}
                            onSectionRefused={handleSectionRefused}
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
    </PageTemplate>
  );
}

EditDoc.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    documentRevision: documentRevisionShape.isRequired,
    proposedSections: PropTypes.arrayOf(sectionShape)
  }).isRequired
};

export default EditDoc;
