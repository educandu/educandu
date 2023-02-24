import PropTypes from 'prop-types';
import classNames from 'classnames';
import Markdown from './markdown.js';
import { Button, Modal, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { useLocale } from './locale-context.js';
import { isMacOs } from '../ui/browser-helper.js';
import DeletedSection from './deleted-section.js';
import LoadingSection from './loading-section.js';
import { useStableCallback } from '../ui/hooks.js';
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
import React, { Fragment, useEffect, useState } from 'react';
import DuplicateIcon from './icons/general/duplicate-icon.js';
import { memoAndTransformProps } from '../ui/react-helper.js';
import HardDeleteIcon from './icons/general/hard-delete-icon.js';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { getSectionElementDataAttributes } from '../utils/doc-utils.js';
import CopyToClipboardIcon from './icons/general/copy-to-clipboard-icon.js';

const createComponents = registeredPlugin => ({
  editorComponent: registeredPlugin?.editorComponent || null,
  displayComponent: registeredPlugin?.displayComponent || null
});

function SectionDisplay({
  section,
  canEdit,
  canHardDelete,
  dragHandleProps,
  isDragged,
  isEditing,
  isOtherSectionDragged,
  isPending,
  onPendingSectionApply,
  onPendingSectionDiscard,
  onSectionDuplicate,
  onSectionDelete,
  onSectionEditEnter,
  onSectionEditLeave,
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

  const registeredPlugin = pluginRegistry.getRegisteredPlugin(section.type);
  const [components, setComponents] = useState(createComponents(registeredPlugin));

  useEffect(() => {
    setComponents(createComponents(registeredPlugin));
  }, [registeredPlugin]);

  useEffect(() => {
    if (!registeredPlugin) {
      return;
    }

    if (isEditing && !components.editorComponent) {
      registeredPlugin.ensureEditorComponentIsLoaded()
        .then(() => setComponents(createComponents(registeredPlugin)));
    }

    if (!isEditing && !components.displayComponent) {
      registeredPlugin.ensureDisplayComponentIsLoaded()
        .then(() => setComponents(createComponents(registeredPlugin)));
    }
  }, [registeredPlugin, components, isEditing]);

  const isHardDeleteEnabled = canHardDelete && !section.deletedOn;

  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const macOSKeyMappings = { ctrl: 'cmd', alt: 'opt' };

  const sectionClasses = classNames({
    'SectionDisplay': true,
    'is-editable': canEdit,
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
      handleAction: () => onSectionEditEnter(),
      isVisible: !isEditing,
      isEnabled: !isEditing && !!section.content
    },
    {
      type: 'preview',
      tooltip: renderActionTooltip('preview', ['ctrl', 'click']),
      icon: <PreviewIcon key="preview" />,
      handleAction: () => onSectionEditLeave(),
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
      handleAction: () => setIsHelpModalOpen(true),
      isVisible: !!settings.pluginsHelpTexts?.[section.type]?.[uiLanguage],
      isEnabled: true
    }
  ].filter(action => action.isVisible);

  const renderDisplayComponent = () => {
    if (!section.content) {
      return <DeletedSection section={section} />;
    }

    if (!registeredPlugin) {
      return <NotSupportedSection />;
    }

    const DisplayComponent = components.displayComponent;
    if (!DisplayComponent) {
      return <LoadingSection />;
    }

    return <DisplayComponent content={section.content} />;
  };

  const handleContentChange = content => {
    onSectionContentChange(content);
  };

  const renderEditorComponent = () => {
    if (!section.content) {
      throw new Error('Cannot edit a deleted section');
    }

    if (!registeredPlugin) {
      return <NotSupportedSection />;
    }

    const EditorComponent = components.editorComponent;
    if (!EditorComponent) {
      return <LoadingSection />;
    }

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
        type="text"
        size="small"
        icon={action.icon}
        disabled={!action.isEnabled}
        className={classNames('u-action-button', { 'u-danger-action-button': action.type === 'delete' })}
        onClick={action.handleAction}
        />
    </Tooltip>
  );

  const renderHardDeleteAction = () => (
    <Tooltip title={t('common:hardDelete')} placement="topRight">
      <Button
        size="small"
        type="text"
        icon={<HardDeleteIcon />}
        onClick={onSectionHardDelete}
        className="u-danger-action-button"
        />
    </Tooltip>
  );

  const renderSectionType = () => {
    return registeredPlugin?.info.getDisplayName(t) || `${t('common:unknown')} (${section.type})`;
  };

  const renderSectionRevision = () => {
    if (!section.revision) {
      return null;
    }
    return (
      <span className="SectionDisplay-sectionRevision">
        {`${t('common:version')}: ${section.revision}`}
      </span>
    );
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
        if (isEditing) {
          onSectionEditLeave();
        } else {
          onSectionEditEnter();
        }
      }
    }
  };

  return (
    <section className={sectionClasses} {...getSectionElementDataAttributes(section)} onClick={handleSectionClick}>
      {isEditing ? renderEditorComponent() : renderDisplayComponent()}

      {!!canEdit && (
        <Fragment>
          <div className={classNames('SectionDisplay-toolbar', { 'is-editing': isEditing })}>
            <div className="SectionDisplay-toolbarInfo" {...dragHandleProps}>
              {renderSectionType()}
              {!!section.revision && <span className="SectionDisplay-sectionRevisionSeparator">|</span>}
              {renderSectionRevision()}
            </div>
            <div className="SectionDisplay-toolbarButtons">
              {editActions.map(renderEditAction)}
            </div>
          </div>
          {!!isPending && (
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
                  className="SectionDisplay-overlayButton SectionDisplay-overlayButton--discard"
                  >
                  <div className="SectionDisplay-overlayButtonIcon"><CloseOutlined /></div>
                </Button>
              </Tooltip>
            </div>
          </Fragment>
          )}
        </Fragment>
      )}

      {!!isHardDeleteEnabled && (
        <div className="SectionDisplay-toolbar is-hidden">
          <div className="SectionDisplay-toolbarInfo">
            {renderSectionRevision()}
          </div>
          <div className="SectionDisplay-toolbarButtons">
            {renderHardDeleteAction()}
          </div>
        </div>
      )}

      <Modal
        footer={null}
        open={isHelpModalOpen}
        onCancel={() => setIsHelpModalOpen(false)}
        destroyOnClose
        >
        <Markdown className="u-modal-body">{settings.pluginsHelpTexts?.[section.type]?.[uiLanguage]}</Markdown>
      </Modal>
    </section>
  );
}

SectionDisplay.propTypes = {
  canEdit: PropTypes.bool.isRequired,
  canHardDelete: PropTypes.bool.isRequired,
  dragHandleProps: PropTypes.object.isRequired,
  isDragged: PropTypes.bool.isRequired,
  isEditing: PropTypes.bool.isRequired,
  isOtherSectionDragged: PropTypes.bool.isRequired,
  isPending: PropTypes.bool.isRequired,
  onPendingSectionApply: PropTypes.func.isRequired,
  onPendingSectionDiscard: PropTypes.func.isRequired,
  onSectionContentChange: PropTypes.func.isRequired,
  onSectionCopyToClipboard: PropTypes.func.isRequired,
  onSectionDelete: PropTypes.func.isRequired,
  onSectionDuplicate: PropTypes.func.isRequired,
  onSectionEditEnter: PropTypes.func.isRequired,
  onSectionEditLeave: PropTypes.func.isRequired,
  onSectionHardDelete: PropTypes.func.isRequired,
  onSectionMoveDown: PropTypes.func.isRequired,
  onSectionMoveUp: PropTypes.func.isRequired,
  section: sectionShape.isRequired
};

export default memoAndTransformProps(SectionDisplay, ({
  onPendingSectionApply,
  onPendingSectionDiscard,
  onSectionDuplicate,
  onSectionDelete,
  onSectionEditEnter,
  onSectionEditLeave,
  onSectionMoveUp,
  onSectionMoveDown,
  onSectionContentChange,
  onSectionCopyToClipboard,
  onSectionHardDelete,
  ...rest
}) => ({
  onPendingSectionApply: useStableCallback(onPendingSectionApply),
  onPendingSectionDiscard: useStableCallback(onPendingSectionDiscard),
  onSectionDuplicate: useStableCallback(onSectionDuplicate),
  onSectionDelete: useStableCallback(onSectionDelete),
  onSectionEditEnter: useStableCallback(onSectionEditEnter),
  onSectionEditLeave: useStableCallback(onSectionEditLeave),
  onSectionMoveUp: useStableCallback(onSectionMoveUp),
  onSectionMoveDown: useStableCallback(onSectionMoveDown),
  onSectionContentChange: useStableCallback(onSectionContentChange),
  onSectionCopyToClipboard: useStableCallback(onSectionCopyToClipboard),
  onSectionHardDelete: useStableCallback(onSectionHardDelete),
  ...rest
}));
