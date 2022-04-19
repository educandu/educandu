import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { isMacOs } from '../ui/browser-helper.js';
import DeletedSection from './deleted-section.js';
import React, { Fragment, useState } from 'react';
import { useService } from './container-context.js';
import EditIcon from './icons/general/edit-icon.js';
import DeleteIcon from './icons/general/delete-icon.js';
import MoveUpIcon from './icons/general/move-up-icon.js';
import PreviewIcon from './icons/general/preview-icon.js';
import PluginRegistry from '../plugins/plugin-registry.js';
import MoveDownIcon from './icons/general/move-down-icon.js';
import NotSupportedSection from './not-supported-section.js';
import DuplicateIcon from './icons/general/duplicate-icon.js';
import HardDeleteIcon from './icons/general/hard-delete-icon.js';
import { sectionShape, filePickerStorageShape } from '../ui/default-prop-types.js';
import { CheckOutlined, CloseOutlined, DragOutlined, PaperClipOutlined } from '@ant-design/icons';

function SectionDisplay({
  section,
  publicStorage,
  privateStorage,
  canEdit,
  canHardDelete,
  dragHandleProps,
  isDragged,
  isOtherSectionDragged,
  isPending,
  onPendingSectionApply,
  onPendingSectionDiscard,
  onSectionDuplicate,
  onSectionDelete,
  onSectionMoveUp,
  onSectionMoveDown,
  onSectionContentChange,
  onSectionCopyToClipboard,
  onSectionHardDelete
}) {
  const { t } = useTranslation();
  const pluginRegistry = useService(PluginRegistry);

  const isHardDeleteEnabled = canHardDelete && !section.deletedOn;

  const sectionClasses = classNames({
    'SectionDisplay': true,
    'is-editable': canEdit,
    'is-hard-deletable': isHardDeleteEnabled,
    'is-dragged': isDragged,
    'is-other-section-dragged': isOtherSectionDragged
  });

  const [isEditing, setIsEditing] = useState(false);

  const macOSKeyMappings = { ctrl: 'cmd', alt: 'opt' };

  const composeShortcutText = parts => parts.map(part => t(`common:${part}`)).join(' + ');

  const renderActionTooltip = (action, shortcutParts = []) => {
    const macOSShortcutParts = shortcutParts.map(part => macOSKeyMappings[part] || part);
    return (
      <div className="SectionDisplay-actionTooltip">
        <div>{t(`common:${action}`)}</div>
        {!!shortcutParts.length && (
          <div className="SectionDisplay-actionTooltipSubtext">
            <div>Windows: {composeShortcutText(shortcutParts)}</div>
            <div>Mac: {composeShortcutText(macOSShortcutParts)}</div>
          </div>
        )}
      </div>
    );
  };

  const editActions = [
    {
      type: 'edit',
      tooltip: renderActionTooltip('edit', ['ctrl', 'click']),
      icon: <EditIcon key="edit" />,
      handleAction: () => setIsEditing(true),
      isVisible: !isEditing,
      isEnabled: !isEditing && !!section.content
    },
    {
      type: 'preview',
      tooltip: renderActionTooltip('preview', ['ctrl', 'click']),
      icon: <PreviewIcon key="preview" />,
      handleAction: () => setIsEditing(false),
      isVisible: isEditing,
      isEnabled: isEditing
    },
    {
      type: 'duplicate',
      tooltip: renderActionTooltip('duplicate', ['shift', 'ctrl', 'click']),
      icon: <DuplicateIcon key="duplicate" />,
      handleAction: () => onSectionDuplicate(),
      isVisible: true,
      isEnabled: !isEditing
    },
    {
      type: 'copyToClipboard',
      tooltip: renderActionTooltip('copyToClipboard'),
      icon: <PaperClipOutlined key="copyToClipboard" />,
      handleAction: () => onSectionCopyToClipboard(),
      isVisible: true,
      isEnabled: !!section.content
    },
    {
      type: 'delete',
      tooltip: renderActionTooltip('delete', ['shift', 'ctrl', 'alt', 'click']),
      icon: <DeleteIcon key="delete" />,
      handleAction: () => onSectionDelete(),
      isVisible: true,
      isEnabled: true
    },
    {
      type: 'moveUp',
      tooltip: renderActionTooltip('moveUp'),
      icon: <MoveUpIcon key="moveUp" />,
      handleAction: () => onSectionMoveUp(),
      isVisible: true,
      isEnabled: true
    },
    {
      type: 'moveDown',
      tooltip: renderActionTooltip('moveDown'),
      icon: <MoveDownIcon key="moveDown" />,
      handleAction: () => onSectionMoveDown(),
      isVisible: true,
      isEnabled: true
    }
  ].filter(action => action.isVisible);

  const renderDisplayComponent = () => {
    if (section.content) {
      const DisplayComponent = pluginRegistry.tryGetDisplayComponentType(section.type) || NotSupportedSection;
      return <DisplayComponent content={section.content} />;
    }

    return <DeletedSection section={section} />;
  };

  const renderEditorComponent = () => {
    if (!section.content) {
      throw new Error('Cannot edit a deleted section');
    }

    const EditorComponent = pluginRegistry.tryGetEditorComponentType(section.type) || NotSupportedSection;
    return (
      <EditorComponent
        publicStorage={publicStorage}
        privateStorage={privateStorage}
        content={section.content}
        onContentChanged={onSectionContentChange}
        />
    );
  };

  const renderEditAction = (action, index) => (
    <Tooltip key={index} title={action.tooltip} placement="topRight">
      <Button
        className={`SectionDisplay-actionButton SectionDisplay-actionButton--${action.type}`}
        size="small"
        icon={action.icon}
        onClick={action.handleAction}
        disabled={!action.isEnabled}
        />
    </Tooltip>
  );

  const renderHardDeleteAction = () => (
    <Tooltip title={t('common:hardDelete')} placement="topRight">
      <Button
        className="SectionDisplay-actionButton SectionDisplay-actionButton--hardDelete"
        size="small"
        icon={<HardDeleteIcon />}
        onClick={onSectionHardDelete}
        />
    </Tooltip>
  );

  const renderSectionInfo = () => {
    const sectionInfo = [
      pluginRegistry.tryGetInfo(section.type)?.getName(t) || `${t('common:unknown')} (${section.type})`,
      section.revision ? `${t('common:revision')}: ${section.revision}` : null
    ].filter(s => s).join(' | ');

    return (<span>{sectionInfo}</span>);
  };

  const renderSectionRevision = () => (
    <span>{section.revision ? `${t('common:revision')}: ${section.revision}` : null}</span>
  );

  const handleSectionClick = event => {
    const ctrlKeyIsPressed = event.ctrlKey;
    const commandKeyIsPressed = isMacOs() && event.metaKey;
    if (canEdit && (ctrlKeyIsPressed || commandKeyIsPressed)) {
      if (event.shiftKey) {
        if (event.altKey) {
          onSectionDelete();
        } else {
          onSectionDuplicate();
        }
      } else if (section.content) {
        setIsEditing(!isEditing);
      }
    }
  };

  return (
    <section className={sectionClasses} onClick={handleSectionClick}>
      {isEditing ? renderEditorComponent() : renderDisplayComponent()}

      {canEdit && (
        <Fragment>
          <div className="SectionDisplay-actions SectionDisplay-actions--left">
            <div className="SectionDisplay-sectionInfo" {...dragHandleProps}>
              <DragOutlined />
              {renderSectionInfo()}
            </div>
          </div>
          <div className="SectionDisplay-actions SectionDisplay-actions--right">
            {editActions.map(renderEditAction)}
          </div>
          { isPending && (
            <Fragment>
              <div className="SectionDisplay-overlay" />
              <div className="SectionDisplay-overlay SectionDisplay-overlay--withButtons">
                <Tooltip title={t('common:apply')}>
                  <Button
                    type="link"
                    onClick={onPendingSectionApply}
                    className="SectionDisplay-overlayButton SectionDisplay-overlayButton--apply"
                    >
                    <div className="SectionDisplay-overlayButtonIcon"><CheckOutlined /></div>
                  </Button>
                </Tooltip>
                <Tooltip title={t('common:discard')}>
                  <Button
                    type="link"
                    onClick={onPendingSectionDiscard}
                    className="SectionDisplay-overlayButton  SectionDisplay-overlayButton--discard"
                    >
                    <div className="SectionDisplay-overlayButtonIcon"><CloseOutlined /></div>
                  </Button>
                </Tooltip>
              </div>
            </Fragment>
          )}
        </Fragment>
      )}

      {isHardDeleteEnabled && (
        <Fragment>
          <div className="SectionDisplay-actions SectionDisplay-actions--left">
            <div className="SectionDisplay-sectionInfo SectionDisplay-sectionInfo--hardDelete">
              {renderSectionRevision()}
            </div>
          </div>
          <div className="SectionDisplay-actions SectionDisplay-actions--right">
            {renderHardDeleteAction()}
          </div>
        </Fragment>
      )}
    </section>
  );
}

SectionDisplay.propTypes = {
  canEdit: PropTypes.bool,
  canHardDelete: PropTypes.bool,
  dragHandleProps: PropTypes.object,
  isDragged: PropTypes.bool,
  isOtherSectionDragged: PropTypes.bool,
  isPending: PropTypes.bool,
  onPendingSectionApply: PropTypes.func,
  onPendingSectionDiscard: PropTypes.func,
  onSectionContentChange: PropTypes.func,
  onSectionCopyToClipboard: PropTypes.func,
  onSectionDelete: PropTypes.func,
  onSectionDuplicate: PropTypes.func,
  onSectionHardDelete: PropTypes.func,
  onSectionMoveDown: PropTypes.func,
  onSectionMoveUp: PropTypes.func,
  privateStorage: filePickerStorageShape,
  publicStorage: filePickerStorageShape.isRequired,
  section: sectionShape.isRequired
};

SectionDisplay.defaultProps = {
  canEdit: false,
  canHardDelete: false,
  dragHandleProps: {},
  isDragged: false,
  isOtherSectionDragged: false,
  isPending: false,
  onPendingSectionApply: () => {},
  onPendingSectionDiscard: () => {},
  onSectionContentChange: () => {},
  onSectionCopyToClipboard: () => {},
  onSectionDelete: () => {},
  onSectionDuplicate: () => {},
  onSectionHardDelete: () => {},
  onSectionMoveDown: () => {},
  onSectionMoveUp: () => {},
  privateStorage: null
};

export default SectionDisplay;
