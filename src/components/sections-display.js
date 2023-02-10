import { Button } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { PlusOutlined } from '@ant-design/icons';
import SectionDisplay from './section-display.js';
import { sectionShape } from '../ui/default-prop-types.js';
import PluginSelectorDialog from './plugin-selector-dialog.js';
import DragAndDropContainer from './drag-and-drop-container.js';
import React, { Fragment, memo, useId, useRef, useState } from 'react';

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
  const droppableIdRef = useRef(useId());
  const [currentNewSectionIndex, setCurrentNewSectionIndex] = useState(-1);

  const handleSectionMove = (fromIndex, toIndex) => {
    onSectionMove(fromIndex, toIndex);
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

  const renderSection = ({ section, index, dragHandleProps = {}, isDragged = false, isOtherDragged = false }) => {
    return (
      <SectionDisplay
        key={section.key}
        section={section}
        canEdit={!!dragHandleProps && canEdit}
        canHardDelete={canHardDelete}
        dragHandleProps={dragHandleProps}
        isDragged={isDragged}
        isEditing={editedSectionKeys.includes(section.key)}
        isOtherSectionDragged={isOtherDragged}
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
        onSectionContentChange={newContent => onSectionContentChange(index, newContent)}
        onSectionHardDelete={() => onSectionHardDelete(index)}
        />
    );
  };

  const renderSectionDivider = ({ insertIndex, isDragged }) => {
    return (
      <div className={classNames('SectionsDisplay-divider', { 'is-hidden': isDragged })}>
        <Button
          shape="circle"
          type="primary"
          icon={<PlusOutlined />}
          className="SectionsDisplay-dividerButton"
          onClick={() => handleNewSectionClick(insertIndex)}
          />
      </div>
    );
  };

  if (!canEdit) {
    return sections.map((section, index) => renderSection({ section, index }));
  }

  const dragAndDropItems = sections.map((section, index) => ({
    key: section.key,
    render: ({ dragHandleProps, isDragged, isOtherDragged }) => {
      return (
        <Fragment>
          {renderSection({ section, index, dragHandleProps, isDragged, isOtherDragged })}
          {renderSectionDivider({ insertIndex: index + 1, isDragged }) }
        </Fragment>
      );
    }
  }));

  return (
    <Fragment>
      { renderSectionDivider({ insertIndex: 0, isDragged: false }) }
      <DragAndDropContainer droppableId={droppableIdRef.current} items={dragAndDropItems} onItemMove={handleSectionMove} />

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

export default memo(SectionsDisplay);
