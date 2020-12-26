import React from 'react';
import Page from '../page';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import urls from '../../utils/urls';
import DocEditor from '../doc-editor';
import Logger from '../../common/logger';
import utils from '../../utils/unique-id';
import { inject } from '../container-context';
import SectionEditor from '../section-editor';
import { Menu, Button, Dropdown } from 'antd';
import cloneDeep from '../../utils/clone-deep';
import errorHelper from '../../ui/error-helper';
import pluginInfos from '../../plugins/plugin-infos';
import ShallowUpdateList from '../shallow-update-list';
import EditorFactory from '../../plugins/editor-factory';
import RendererFactory from '../../plugins/renderer-factory';
import DocumentApiClient from '../../services/document-api-client';
import { docShape, sectionShape } from '../../ui/default-prop-types';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { PlusOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';

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
    const { doc, sections } = initialState;

    this.editorFactory = editorFactory;
    this.rendererFactory = rendererFactory;
    this.documentApiClient = documentApiClient;

    this.state = this.createStateFromDoc({ doc, sections });

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
      editedDoc: cloneDeep(doc),
      editedSections: cloneDeep(sections),
      isDirty: false,
      invalidSectionKeys: []
    };
  }

  handleMetadataChanged(metadata) {
    this.setState(prevState => {
      return {
        editedDoc: { ...prevState.editedDoc, ...metadata },
        isDirty: true
      };
    });
  }

  handleContentChanged(sectionKey, content, isInvalid) {
    this.setState(prevState => {
      return {
        editedSections: prevState.editedSections.map(sec => sec.key === sectionKey ? { ...sec, content } : sec),
        isDirty: true,
        invalidSectionKeys: isInvalid
          ? addKeyIfNotExists(prevState.invalidSectionKeys, sectionKey)
          : removeKeyIfExists(prevState.invalidSectionKeys, sectionKey)
      };
    });
  }

  handleSectionMovedUp(sectionKey) {
    const { editedSections } = this.state;
    const sourceIndex = editedSections.findIndex(section => section.key === sectionKey);
    const destinationIndex = sourceIndex - 1;
    this.moveSection(sourceIndex, destinationIndex);
  }

  handleSectionMovedDown(sectionKey) {
    const { editedSections } = this.state;
    const sourceIndex = editedSections.findIndex(section => section.key === sectionKey);
    const destinationIndex = sourceIndex + 1;
    this.moveSection(sourceIndex, destinationIndex);
  }

  handleSectionDeleted(sectionKey) {
    this.setState(prevState => {
      return {
        editedSections: prevState.editedSections.filter(sec => sec.key !== sectionKey),
        isDirty: true,
        invalidSectionKeys: removeKeyIfExists(prevState.invalidSectionKeys, sectionKey)
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

  async handleSaveClick() {
    const { editedDoc, editedSections } = this.state;
    const payload = {
      doc: {
        key: editedDoc.key,
        title: editedDoc.title,
        slug: editedDoc.slug
      },
      sections: editedSections.map(section => ({
        ancestorId: section._id,
        key: section.key,
        type: section.type,
        content: section.content
      }))
    };

    try {
      const { doc, sections } = await this.documentApiClient.saveDocument(payload);
      this.setState(this.createStateFromDoc({ doc, sections }));
    } catch (error) {
      errorHelper.handleApiError(error, logger);
    }
  }

  handleBackClick() {
    const { originalDoc } = this.state;
    window.location = urls.getDocUrl(originalDoc.key);
  }

  handleDragEnd({ source, destination }) {
    if (destination) {
      this.moveSection(source.index, destination.index);
    }
  }

  moveSection(sourceIndex, destinationIndex) {
    const { editedSections } = this.state;
    if (canReorder(editedSections, sourceIndex, destinationIndex)) {
      this.setState({
        editedSections: reorder(editedSections, sourceIndex, destinationIndex),
        isDirty: true
      });
    }
  }

  render() {
    const { language } = this.props;
    const { editedDoc, editedSections, isDirty, invalidSectionKeys } = this.state;

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

    return (
      <Page headerActions={headerActions}>
        <div className="EditDocPage">
          <div className="EditDocPage-docEditor">
            <DocEditor
              onChanged={this.handleMetadataChanged}
              doc={editedDoc}
              />
          </div>
          <DragDropContext onDragEnd={this.handleDragEnd}>
            <Droppable droppableId="droppable" ignoreContainerClipping>
              {droppableProvided => (
                <div ref={droppableProvided.innerRef} {...droppableProvided.droppableProps}>
                  <ShallowUpdateList items={editedSections}>
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
                              dragHandleProps={draggableProvided.dragHandleProps}
                              isHighlighted={draggableState.isDragging}
                              isInvalid={invalidSectionKeys.includes(section.key)}
                              language={language}
                              section={section}
                              doc={editedDoc}
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
    doc: docShape,
    sections: PropTypes.arrayOf(sectionShape)
  }).isRequired,
  language: PropTypes.string.isRequired,
  rendererFactory: PropTypes.instanceOf(RendererFactory).isRequired
};

export default inject({
  documentApiClient: DocumentApiClient,
  rendererFactory: RendererFactory,
  editorFactory: EditorFactory
}, EditDoc);
