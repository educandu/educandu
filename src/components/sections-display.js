import PropTypes from 'prop-types';
import { Button, Divider } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import React, { Fragment, useState } from 'react';
import SectionDisplay from './section-display.js';
import PluginSelectorDialog from './plugin-selector-dialog.js';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { sectionShape, filePickerStorageShape } from '../ui/default-prop-types.js';

function SectionsDisplay({
  sections,
  pendingSectionKeys,
  publicStorage,
  privateStorage,
  canEdit,
  canHardDelete,
  onPendingSectionApply,
  onPendingSectionDiscard,
  onSectionMove,
  onSectionInsert,
  onSectionDuplicate,
  onSectionDelete,
  onSectionContentChange,
  onSectionHardDelete
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [currentNewSectionIndex, setCurrentNewSectionIndex] = useState(-1);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = ({ source, destination }) => {
    setIsDragging(false);
    if (destination) {
      onSectionMove(source.index, destination.index);
    }
  };

  const handleSectionMove = (sourceIndex, destinationIndex) => {
    if (sourceIndex !== destinationIndex
        && destinationIndex >= 0
        && destinationIndex <= (sections.length - 1)) {
      onSectionMove(sourceIndex, destinationIndex);
    }
  };

  const handleNewSectionClick = insertIndex => {
    setCurrentNewSectionIndex(insertIndex);
  };

  const handlePluginSelectorDialogSelect = pluginType => {
    onSectionInsert(pluginType, currentNewSectionIndex);
    setCurrentNewSectionIndex(-1);
  };

  const handlePluginSelectorDialogCancel = () => {
    setCurrentNewSectionIndex(-1);
  };

  const renderSection = ({ section, index, dragHandleProps, isDragged }) => {
    return (<SectionDisplay
      key={section.key}
      section={section}
      publicStorage={publicStorage}
      privateStorage={privateStorage}
      canEdit={!!dragHandleProps && canEdit}
      canHardDelete={canHardDelete}
      dragHandleProps={dragHandleProps}
      isDragged={isDragged}
      isOtherSectionDragged={isDragging && !isDragged}
      isPending={pendingSectionKeys.includes(section.key)}
      onPendingSectionApply={() => onPendingSectionApply(index)}
      onPendingSectionDiscard={() => onPendingSectionDiscard(index)}
      onSectionDelete={() => onSectionDelete(index)}
      onSectionDuplicate={() => onSectionDuplicate(index)}
      onSectionMoveUp={() => handleSectionMove(index, index - 1)}
      onSectionMoveDown={() => handleSectionMove(index, index + 1)}
      onSectionContentChange={(newContent, isInvalid) => onSectionContentChange(index, newContent, isInvalid)}
      onSectionHardDelete={() => onSectionHardDelete(index)}
      />);
  };

  const renderSectionDivider = insertIndex => {
    return (
      <Divider className={`${isDragging ? 'u-hidden' : ''}`}>
        <Button
          shape="circle"
          size="small"
          type="primary"
          onClick={() => handleNewSectionClick(insertIndex)}
          icon={<PlusOutlined style={{ fontSize: '12px', display: 'flex' }} />}
          style={{ transition: 'none', height: '18px', minWidth: 'unset', width: '18px', verticalAlign: 'baseline' }}
          />
      </Divider>
    );
  };

  if (!canEdit) {
    return sections.map((section, index) => renderSection({ section, index }));
  }

  return (
    <Fragment>
      { renderSectionDivider(0) }
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <Droppable droppableId="droppable" ignoreContainerClipping>
          {droppableProvided => (
            <div ref={droppableProvided.innerRef} {...droppableProvided.droppableProps}>
              {sections.map((section, index) => (
                <Draggable key={section.key} draggableId={section.key} index={index}>
                  {(draggableProvided, draggableState) => (
                    <div
                      key={section.key}
                      ref={draggableProvided.innerRef}
                      {...draggableProvided.draggableProps}
                      style={{
                        userSelect: draggableState.isDragging ? 'none' : null,
                        ...draggableProvided.draggableProps.style
                      }}
                      >
                      {renderSection({
                        section,
                        index,
                        dragHandleProps: draggableProvided.dragHandleProps,
                        isDragged: draggableState.isDragging
                      })}
                      {renderSectionDivider(index + 1) }
                    </div>
                  )}
                </Draggable>
              ))}
              {droppableProvided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <PluginSelectorDialog
        visible={currentNewSectionIndex > -1}
        onSelect={handlePluginSelectorDialogSelect}
        onCancel={handlePluginSelectorDialogCancel}
        />
    </Fragment>
  );
}

SectionsDisplay.propTypes = {
  canEdit: PropTypes.bool,
  canHardDelete: PropTypes.bool,
  onPendingSectionApply: PropTypes.func,
  onPendingSectionDiscard: PropTypes.func,
  onSectionContentChange: PropTypes.func,
  onSectionDelete: PropTypes.func,
  onSectionDuplicate: PropTypes.func,
  onSectionHardDelete: PropTypes.func,
  onSectionInsert: PropTypes.func,
  onSectionMove: PropTypes.func,
  pendingSectionKeys: PropTypes.arrayOf(PropTypes.string),
  privateStorage: filePickerStorageShape,
  publicStorage: filePickerStorageShape.isRequired,
  sections: PropTypes.arrayOf(sectionShape).isRequired
};

SectionsDisplay.defaultProps = {
  canEdit: false,
  canHardDelete: false,
  onPendingSectionApply: () => {},
  onPendingSectionDiscard: () => {},
  onSectionContentChange: () => {},
  onSectionDelete: () => {},
  onSectionDuplicate: () => {},
  onSectionHardDelete: () => {},
  onSectionInsert: () => {},
  onSectionMove: () => {},
  pendingSectionKeys: [],
  privateStorage: null
};

export default SectionsDisplay;
