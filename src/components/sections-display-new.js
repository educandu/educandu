import PropTypes from 'prop-types';
import { Button, Divider } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import React, { Fragment, useState } from 'react';
import SectionDisplayNew from './section-display-new.js';
import { sectionShape } from '../ui/default-prop-types.js';
import PluginSelectorDialog from './plugin-selector-dialog.js';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function SectionsDisplayNew({
  sections,
  canEdit,
  onSectionMoved,
  onSectionInserted,
  onSectionDuplicated,
  onSectionDeleted
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [currentNewSectionIndex, setCurrentNewSectionIndex] = useState(-1);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = ({ source, destination }) => {
    setIsDragging(false);
    if (destination) {
      onSectionMoved(source.index, destination.index);
    }
  };

  const handleSectionMoved = (sourceIndex, destinationIndex) => {
    if (sourceIndex !== destinationIndex
        && destinationIndex >= 0
        && destinationIndex <= (sections.length - 1)) {
      onSectionMoved(sourceIndex, destinationIndex);
    }
  };

  const handleNewSectionClick = insertIndex => {
    setCurrentNewSectionIndex(insertIndex);
  };

  const handlePluginSelectorDialogSelect = pluginType => {
    onSectionInserted(pluginType, currentNewSectionIndex);
    setCurrentNewSectionIndex(-1);
  };

  const handlePluginSelectorDialogCancel = () => {
    setCurrentNewSectionIndex(-1);
  };

  const renderSection = ({ section, index, dragHandleProps, isDragged }) => {
    return (<SectionDisplayNew
      key={section.key}
      section={section}
      canEdit={!!dragHandleProps && canEdit}
      dragHandleProps={dragHandleProps}
      isDragged={isDragged}
      isOtherSectionDragged={isDragging && !isDragged}
      onSectionDelete={() => onSectionDeleted(index)}
      onSectionDuplicate={() => onSectionDuplicated(index)}
      onSectionMoveUp={() => handleSectionMoved(index, index - 1)}
      onSectionMoveDown={() => handleSectionMoved(index, index + 1)}
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

SectionsDisplayNew.propTypes = {
  canEdit: PropTypes.bool.isRequired,
  onSectionDeleted: PropTypes.func.isRequired,
  onSectionDuplicated: PropTypes.func.isRequired,
  onSectionInserted: PropTypes.func.isRequired,
  onSectionMoved: PropTypes.func.isRequired,
  sections: PropTypes.arrayOf(sectionShape).isRequired
};

export default SectionsDisplayNew;
