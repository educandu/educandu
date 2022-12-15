import PropTypes from 'prop-types';
import { Button, Divider } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import React, { Fragment, useState } from 'react';
import SectionDisplay from './section-display.js';
import { sectionShape } from '../ui/default-prop-types.js';
import PluginSelectorDialog from './plugin-selector-dialog.js';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function SectionsDisplay({
  sections,
  pendingSectionKeys,
  canEdit,
  canHardDelete,
  editedSectionKeys,
  onPendingSectionApply,
  onPendingSectionDiscard,
  onSectionMove,
  onSectionInsert,
  onSectionDuplicate,
  onSectionDelete,
  onSectionEditEnter,
  onSectionEditLeave,
  onSectionContentChange,
  onSectionCopyToClipboard,
  onSectionPasteFromClipboard,
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

  const handlePasteFromClipboard = async () => {
    const success = await onSectionPasteFromClipboard(currentNewSectionIndex);
    if (success) {
      setCurrentNewSectionIndex(-1);
    }
  };

  const renderSection = ({ section, index, dragHandleProps = {}, isDragged = false }) => {
    return (
      <SectionDisplay
        key={section.key}
        section={section}
        canEdit={!!dragHandleProps && canEdit}
        canHardDelete={canHardDelete}
        dragHandleProps={dragHandleProps}
        isDragged={isDragged}
        isEditing={editedSectionKeys.includes(section.key)}
        isOtherSectionDragged={!!isDragging && !isDragged}
        isPending={pendingSectionKeys.includes(section.key)}
        onPendingSectionApply={() => onPendingSectionApply(index)}
        onPendingSectionDiscard={() => onPendingSectionDiscard(index)}
        onSectionCopyToClipboard={() => onSectionCopyToClipboard(index)}
        onSectionDelete={() => onSectionDelete(index)}
        onSectionDuplicate={() => onSectionDuplicate(index)}
        onSectionEditEnter={() => onSectionEditEnter(index)}
        onSectionEditLeave={() => onSectionEditLeave(index)}
        onSectionMoveUp={() => handleSectionMove(index, index - 1)}
        onSectionMoveDown={() => handleSectionMove(index, index + 1)}
        onSectionContentChange={(newContent, isInvalid) => onSectionContentChange(index, newContent, isInvalid)}
        onSectionHardDelete={() => onSectionHardDelete(index)}
        />
    );
  };

  const renderSectionDivider = insertIndex => {
    return (
      <Divider className={`${isDragging ? 'u-hidden' : ''}`}>
        <Button
          shape="circle"
          size="small"
          type="primary"
          onClick={() => handleNewSectionClick(insertIndex)}
          icon={<PlusOutlined style={{ fontSize: '12px' }} />}
          style={{ transition: 'none', height: '18px', minWidth: 'unset', width: '18px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
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
        isOpen={currentNewSectionIndex > -1}
        onSelect={handlePluginSelectorDialogSelect}
        onCancel={handlePluginSelectorDialogCancel}
        onPasteFromClipboard={handlePasteFromClipboard}
        />
    </Fragment>
  );
}

SectionsDisplay.propTypes = {
  canEdit: PropTypes.bool,
  canHardDelete: PropTypes.bool,
  editedSectionKeys: PropTypes.arrayOf(PropTypes.string),
  onPendingSectionApply: PropTypes.func,
  onPendingSectionDiscard: PropTypes.func,
  onSectionContentChange: PropTypes.func,
  onSectionCopyToClipboard: PropTypes.func,
  onSectionDelete: PropTypes.func,
  onSectionDuplicate: PropTypes.func,
  onSectionEditEnter: PropTypes.func,
  onSectionEditLeave: PropTypes.func,
  onSectionHardDelete: PropTypes.func,
  onSectionInsert: PropTypes.func,
  onSectionMove: PropTypes.func,
  onSectionPasteFromClipboard: PropTypes.func,
  pendingSectionKeys: PropTypes.arrayOf(PropTypes.string),
  sections: PropTypes.arrayOf(sectionShape).isRequired
};

SectionsDisplay.defaultProps = {
  canEdit: false,
  canHardDelete: false,
  editedSectionKeys: [],
  onPendingSectionApply: () => {},
  onPendingSectionDiscard: () => {},
  onSectionContentChange: () => {},
  onSectionCopyToClipboard: () => {},
  onSectionDelete: () => {},
  onSectionDuplicate: () => {},
  onSectionEditEnter: () => {},
  onSectionEditLeave: () => {},
  onSectionHardDelete: () => {},
  onSectionInsert: () => {},
  onSectionMove: () => {},
  onSectionPasteFromClipboard: () => {},
  pendingSectionKeys: []
};

export default SectionsDisplay;
