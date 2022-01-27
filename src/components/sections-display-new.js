import PropTypes from 'prop-types';
import React, { useState } from 'react';
import SectionDisplayNew from './section-display-new.js';
import { sectionShape } from '../ui/default-prop-types.js';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function SectionsDisplayNew({ sections, canEdit, onSectionMoved }) {
  const [isDragging, setIsDragging] = useState(false);

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

  const renderSection = ({ section, index, dragHandleProps, isDragged }) => {
    return (<SectionDisplayNew
      key={section.key}
      section={section}
      canEdit={!!dragHandleProps && canEdit}
      dragHandleProps={dragHandleProps}
      isDragged={isDragged}
      isOtherSectionDragged={isDragging && !isDragged}
      onSectionMoveUp={() => handleSectionMoved(index, index - 1)}
      onSectionMoveDown={() => handleSectionMoved(index, index + 1)}
      />);
  };

  if (!canEdit) {
    return sections.map((section, index) => renderSection({ section, index }));
  }

  return (
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
                  </div>
                )}
              </Draggable>
            ))}
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
