import { Button } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import EmptyState from './empty-state.js';
import { useTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import SectionDisplay from './section-display.js';
import FileIcon from './icons/general/file-icon.js';
import PluginSelectorDialog from './plugin-selector-dialog.js';
import DragAndDropContainer from './drag-and-drop-container.js';
import React, { Fragment, memo, useId, useRef, useState } from 'react';
import { documentInputShape, pendingDocumentInputShape, sectionShape } from '../ui/default-prop-types.js';

const SECTION_PREVIEW_CONTEXT = { isPreview: true };
const SECTION_NON_PREVIEW_CONTEXT = { isPreview: false };

function SectionsDisplay({
  sections,
  documentInput,
  pendingSectionKeys,
  canEdit,
  canModifyInputs,
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
  onSectionInputChange,
  onSectionCopyToClipboard,
  onSectionPasteFromClipboard,
  onSectionHardDelete
}) {
  const droppableIdRef = useRef(useId());
  const { t } = useTranslation('sectionsDisplay');
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
    const isEditing = editedSectionKeys.includes(section.key);
    return (
      <SectionDisplay
        key={section.key}
        context={canEdit && !isEditing ? SECTION_PREVIEW_CONTEXT : SECTION_NON_PREVIEW_CONTEXT}
        section={section}
        sectionInput={documentInput?.sections[section.key] ?? null}
        canEdit={!!dragHandleProps && canEdit}
        canModifyInput={canModifyInputs}
        canHardDelete={canHardDelete}
        dragHandleProps={dragHandleProps}
        isDragged={isDragged}
        isEditing={isEditing}
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
        onSectionInputChange={newInput => onSectionInputChange(section.key, newInput)}
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

  const showEmptyState = !!canEdit && !sections.length && !pendingSectionKeys.length;

  return (
    <Fragment>
      {!!showEmptyState && (
        <EmptyState
          icon={<FileIcon />}
          title={t('emptyStateTitle')}
          subtitle={t('emptyStateSubtitle')}
          button={{
            icon: <PlusOutlined />,
            text: t('emptyStateButton'),
            onClick: () => handleNewSectionClick(0)
          }}
          />
      )}
      {!showEmptyState && (
        <Fragment>
          { renderSectionDivider({ insertIndex: 0, isDragged: false }) }
          <DragAndDropContainer droppableId={droppableIdRef.current} items={dragAndDropItems} onItemMove={handleSectionMove} />
        </Fragment>
      )}

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
  canModifyInputs: PropTypes.bool,
  canHardDelete: PropTypes.bool,
  editedSectionKeys: PropTypes.arrayOf(PropTypes.string),
  onPendingSectionApply: PropTypes.func,
  onPendingSectionDiscard: PropTypes.func,
  onSectionContentChange: PropTypes.func,
  onSectionInputChange: PropTypes.func,
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
  sections: PropTypes.arrayOf(sectionShape).isRequired,
  documentInput: PropTypes.oneOfType([documentInputShape, pendingDocumentInputShape])
};

SectionsDisplay.defaultProps = {
  canEdit: false,
  canModifyInputs: false,
  canHardDelete: false,
  editedSectionKeys: [],
  onPendingSectionApply: () => {},
  onPendingSectionDiscard: () => {},
  onSectionContentChange: () => {},
  onSectionInputChange: () => {},
  onSectionCopyToClipboard: () => {},
  onSectionDelete: () => {},
  onSectionDuplicate: () => {},
  onSectionEditEnter: () => {},
  onSectionEditLeave: () => {},
  onSectionHardDelete: () => {},
  onSectionInsert: () => {},
  onSectionMove: () => {},
  onSectionPasteFromClipboard: () => {},
  pendingSectionKeys: [],
  documentInput: null
};

export default memo(SectionsDisplay);
