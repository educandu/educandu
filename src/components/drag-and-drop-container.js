import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function DragAndDropContainer({
  items,
  droppableId,
  onItemMove
}) {

  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = ({ source, destination }) => {
    setIsDragging(false);
    const fromIndex = source?.index;
    const toIndex = destination?.index;
    if (!!source && !!destination && fromIndex !== toIndex && toIndex >= 0 && toIndex <= (items.length - 1)) {
      onItemMove(fromIndex, toIndex);
    }
  };

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Droppable droppableId={droppableId} ignoreContainerClipping>
        {droppableProvided => (
          <div ref={droppableProvided.innerRef} {...droppableProvided.droppableProps}>
            {items.map((item, index) => (
              <Draggable key={item.key} draggableId={item.key} index={index}>
                {(draggableProvided, draggableState) => (
                  <div
                    key={item.key}
                    ref={draggableProvided.innerRef}
                    {...draggableProvided.draggableProps}
                    style={{
                      userSelect: draggableState.isDragging ? 'none' : null,
                      ...draggableProvided.draggableProps.style
                    }}
                    >
                    <section key={item.key}>
                      {item.render({
                        dragHandleProps: draggableProvided.dragHandleProps,
                        isDragged: draggableState.isDragging,
                        isOtherDragged: !!isDragging && !draggableState.isDragging
                      })}
                    </section>
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

DragAndDropContainer.propTypes = {
  droppableId: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    render: PropTypes.func.isRequired
  })).isRequired,
  onItemMove: PropTypes.func
};

DragAndDropContainer.defaultProps = {
  onItemMove: () => {}
};

export default DragAndDropContainer;
