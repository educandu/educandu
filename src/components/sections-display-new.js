import React from 'react';
import PropTypes from 'prop-types';
import ShallowUpdateList from './shallow-update-list.js';
import SectionDisplayNew from './section-display-new.js';
import { sectionShape } from '../ui/default-prop-types.js';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function SectionsDisplayNew({ sections, canEdit, onSectionMoved }) {

  const handleDragEnd = ({ source, destination }) => {
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

  const renderSection = (section, index, dragHandleProps) => (
    <SectionDisplayNew
      key={section.key}
      section={section}
      canEdit={!!dragHandleProps && canEdit}
      dragHandleProps={dragHandleProps}
      onSectionMoveUp={() => handleSectionMoved(index, index - 1)}
      onSectionMoveDown={() => handleSectionMoved(index, index + 1)}
      />
  );

  if (!canEdit) {
    return sections.map((section, index) => renderSection(section, index));
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="droppable" ignoreContainerClipping>
        {droppableProvided => (
          <div ref={droppableProvided.innerRef} {...droppableProvided.droppableProps}>
            <ShallowUpdateList items={sections}>
              {(section, index) => (
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
                      {renderSection(section, index, draggableProvided.dragHandleProps)}
                    </div>
                  )}
                </Draggable>
              )}
            </ShallowUpdateList>
            {droppableProvided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

SectionsDisplayNew.propTypes = {
  canEdit: PropTypes.bool.isRequired,
  onSectionMoved: PropTypes.func.isRequired,
  sections: PropTypes.arrayOf(sectionShape).isRequired
};

export default SectionsDisplayNew;
