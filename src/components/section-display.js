import PropTypes from 'prop-types';
import classNames from 'classnames';
import Markdown from './markdown.js';
import { Button, Modal, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { useLocale } from './locale-context.js';
import { isMacOs } from '../ui/browser-helper.js';
import DeletedSection from './deleted-section.js';
import React, { Fragment, useState } from 'react';
import HelpIcon from './icons/general/help-icon.js';
import EditIcon from './icons/general/edit-icon.js';
import { useService } from './container-context.js';
import { useSettings } from './settings-context.js';
import DeleteIcon from './icons/general/delete-icon.js';
import MoveUpIcon from './icons/general/move-up-icon.js';
import PreviewIcon from './icons/general/preview-icon.js';
import PluginRegistry from '../plugins/plugin-registry.js';
import { sectionShape } from '../ui/default-prop-types.js';
import MoveDownIcon from './icons/general/move-down-icon.js';
import NotSupportedSection from './not-supported-section.js';
import DuplicateIcon from './icons/general/duplicate-icon.js';
import HardDeleteIcon from './icons/general/hard-delete-icon.js';
import CopyToClipboardIcon from './icons/general/copy-to-clipboard-icon.js';
import { CheckOutlined, CloseOutlined, DragOutlined } from '@ant-design/icons';

function SectionDisplay({
  section,
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
  const settings = useSettings();
  const { uiLanguage } = useLocale();
  const pluginRegistry = useService(PluginRegistry);

  const isHardDeleteEnabled = canHardDelete && !section.deletedOn;

  const [isEditing, setIsEditing] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);
  const [isHelpModalVisible, setIsHelpModalVisible] = useState(false);

  const macOSKeyMappings = { ctrl: 'cmd', alt: 'opt' };

  const sectionClasses = classNames({
    'SectionDisplay': true,
    'is-editable': canEdit,
    'is-invalid': isInvalid,
    'is-hard-deletable': isHardDeleteEnabled,
    'is-dragged': isDragged,
    'is-other-section-dragged': isOtherSectionDragged
  });

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
      isEnabled: true
    },
    {
      type: 'copyToClipboard',
      tooltip: renderActionTooltip('copyToClipboard'),
      icon: <CopyToClipboardIcon key="copyToClipboard" />,
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
    },
    {
      type: 'openHelp',
      tooltip: renderActionTooltip('openHelp'),
      icon: <HelpIcon key="openHelp" />,
      handleAction: () => setIsHelpModalVisible(true),
      isVisible: !!settings.pluginsHelpTexts?.[section.type]?.[uiLanguage],
      isEnabled: true
    }
  ].filter(action => action.isVisible);

  const renderDisplayComponent = () => {
    if (section.content) {
      const DisplayComponent = pluginRegistry.tryGetDisplayComponent(section.type) || NotSupportedSection;
      return <DisplayComponent content={section.content} />;
    }

    return <DeletedSection section={section} />;
  };

  const handleContentChange = (content, newIsInvalid) => {
    setIsInvalid(newIsInvalid);
    onSectionContentChange(content, newIsInvalid);
  };

  const renderEditorComponent = () => {
    if (!section.content) {
      throw new Error('Cannot edit a deleted section');
    }

    const EditorComponent = pluginRegistry.tryGetEditorComponent(section.type) || NotSupportedSection;
    return (
      <EditorComponent
        content={section.content}
        onContentChanged={handleContentChange}
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

  const renderSectionType = () => {
    return pluginRegistry.tryGetInfo(section.type)?.getName(t) || `${t('common:unknown')} (${section.type})`;
  };

  const renderSectionRevision = () => {
    if (!section.revision) {
      return null;
    }
    return (<span className="SectionDisplay-sectionRevision">{`${t('common:revision')}: ${section.revision}`}</span>);
  };

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
              {renderSectionType()}
              {!!section.revision && <span className="SectionDisplay-sectionRevisionSeparator">|</span>}
              {renderSectionRevision()}
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

      <Modal
        footer={null}
        visible={isHelpModalVisible}
        onCancel={() => setIsHelpModalVisible(false)}
        destroyOnClose
        >
        <Markdown>{settings.pluginsHelpTexts?.[section.type]?.[uiLanguage]}</Markdown>
      </Modal>
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
  onSectionMoveUp: () => {}
};

export default SectionDisplay;
