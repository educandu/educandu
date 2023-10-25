import PropTypes from 'prop-types';
import classNames from 'classnames';
import Markdown from './markdown.js';
import { Button, Modal, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { useLocale } from './locale-context.js';
import { isMacOs } from '../ui/browser-helper.js';
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
import MoveDownIcon from './icons/general/move-down-icon.js';
import React, { Fragment, useEffect, useState } from 'react';
import DuplicateIcon from './icons/general/duplicate-icon.js';
import { memoAndTransformProps } from '../ui/react-helper.js';
import HardDeleteIcon from './icons/general/hard-delete-icon.js';
import EmptyState, { EMPTY_STATE_STATUS } from './empty-state.js';
import CopyToClipboardIcon from './icons/general/copy-to-clipboard-icon.js';
import { getSectionElementDataAttributes } from '../utils/document-utils.js';
import DocumentInputSectionComments from './document-input-section-comments.js';
import { CheckOutlined, CloseCircleFilled, CloseOutlined } from '@ant-design/icons';
import { sectionContextShape, sectionInputShape, sectionShape } from '../ui/default-prop-types.js';

const BORDER_DISPLAY = {
  permanent: 'permanent',
  hoverable: 'hoverable',
  none: 'none'
};

const createComponents = registeredPlugin => ({
  editorComponent: registeredPlugin?.editorComponent || null,
  displayComponent: registeredPlugin?.displayComponent || null
});

function SectionDisplay({
  documentInputId,
  sectionInput,
  section,
  context,
  canEdit,
  canHardDelete,
  canModifyInput,
  canCopyToClipboard,
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
  onSectionInputChange,
  onSectionContentChange,
  onSectionCopyToClipboard,
  onSectionHardDelete
}) {
  const settings = useSettings();
  const { uiLanguage } = useLocale();
  const { t } = useTranslation('sectionDisplay');
  const pluginRegistry = useService(PluginRegistry);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
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

  const toolbarActions = [
    {
      type: 'edit',
      tooltip: renderActionTooltip('edit', ['ctrl', 'click']),
      icon: <EditIcon key="edit" />,
      handleAction: () => onSectionEditEnter(),
      isVisible: canEdit && !isEditing,
      isEnabled: !isEditing && !!section.content,
      isDangerous: false
    },
    {
      type: 'preview',
      tooltip: renderActionTooltip('preview', ['ctrl', 'click']),
      icon: <PreviewIcon key="preview" />,
      handleAction: () => onSectionEditLeave(),
      isVisible: canEdit && isEditing,
      isEnabled: isEditing,
      isDangerous: false
    },
    {
      type: 'duplicate',
      tooltip: renderActionTooltip('duplicate', ['shift', 'ctrl', 'click']),
      icon: <DuplicateIcon key="duplicate" />,
      handleAction: () => onSectionDuplicate(),
      isVisible: canEdit,
      isEnabled: true,
      isDangerous: false
    },
    {
      type: 'copyToClipboard',
      tooltip: renderActionTooltip('copyToClipboard'),
      icon: <CopyToClipboardIcon key="copyToClipboard" />,
      handleAction: () => onSectionCopyToClipboard(),
      isVisible: canCopyToClipboard,
      isEnabled: !!section.content,
      isDangerous: false
    },
    {
      type: 'delete',
      tooltip: renderActionTooltip('delete', ['shift', 'ctrl', 'alt', 'click']),
      icon: <DeleteIcon key="delete" />,
      handleAction: () => onSectionDelete(),
      isVisible: canEdit,
      isEnabled: true,
      isDangerous: true
    },
    {
      type: 'hardDelete',
      tooltip: renderActionTooltip('hardDelete'),
      icon: <HardDeleteIcon key="hardDelete" />,
      handleAction: () => onSectionHardDelete(),
      isVisible: canHardDelete,
      isEnabled: !!section.content,
      isDangerous: true
    },
    {
      type: 'moveUp',
      tooltip: null,
      icon: <MoveUpIcon key="moveUp" />,
      handleAction: () => onSectionMoveUp(),
      isVisible: canEdit,
      isEnabled: true,
      isDangerous: false
    },
    {
      type: 'moveDown',
      tooltip: null,
      icon: <MoveDownIcon key="moveDown" />,
      handleAction: () => onSectionMoveDown(),
      isVisible: canEdit,
      isEnabled: true,
      isDangerous: false
    },
    {
      type: 'openHelp',
      tooltip: renderActionTooltip('openHelp'),
      icon: <HelpIcon key="openHelp" />,
      handleAction: () => setIsHelpModalOpen(true),
      isVisible: canEdit && !!settings.pluginsHelpTexts?.[section.type]?.[uiLanguage],
      isEnabled: true,
      isDangerous: false
    }
  ].filter(action => action.isVisible);

  const renderNotSupportedSection = () => {
    return (
      <EmptyState
        title={t('notSupportedSectionEmptyStateTitle')}
        subtitle={t('notSupportedSectionEmptyStateSubtitle')}
        status={EMPTY_STATE_STATUS.error}
        />
    );
  };

  const renderDisplayComponent = () => {
    if (!section.content) {
      return (
        <EmptyState
          icon={<CloseCircleFilled />}
          title={t('deletedSectionEmptyStateTitle')}
          subtitle={section.deletedBecause}
          status={EMPTY_STATE_STATUS.error}
          />
      );
    }

    if (!registeredPlugin) {
      return renderNotSupportedSection();
    }

    const DisplayComponent = components.displayComponent;
    if (!DisplayComponent) {
      return <LoadingSection />;
    }

    return (
      <Fragment>
        <DisplayComponent
          context={context}
          input={sectionInput}
          content={section.content}
          canModifyInput={canModifyInput}
          onInputChanged={onSectionInputChange}
          />
        {!!registeredPlugin.info.allowsInput && !!documentInputId && (
          <DocumentInputSectionComments
            documentInputId={documentInputId}
            sectionKey={section.key}
            initialComments={sectionInput.comments}
            />
        )}
      </Fragment>
    );
  };

  const handleContentChange = content => {
    onSectionContentChange(content);
  };

  const renderEditorComponent = () => {
    if (!section.content) {
      throw new Error('Cannot edit a deleted section');
    }

    if (!registeredPlugin) {
      return renderNotSupportedSection();
    }

    const EditorComponent = components.editorComponent;
    if (!EditorComponent) {
      return <LoadingSection />;
    }

    return (
      <EditorComponent
        context={context}
        content={section.content}
        onContentChanged={handleContentChange}
        />
    );
  };

  const renderToolbarAction = action => {
    const button = (
      <Button
        type="text"
        size="small"
        key={action.type}
        icon={action.icon}
        disabled={!action.isEnabled}
        className={classNames('u-action-button', { 'u-danger-action-button': action.isEnabled && action.isDangerous })}
        onClick={action.handleAction}
        />
    );

    return action.isEnabled
      ? <Tooltip key={action.type} title={action.tooltip} placement="topRight">{button}</Tooltip>
      : button;
  };

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

  let borderDisplay;
  if (canEdit) {
    borderDisplay = BORDER_DISPLAY.permanent;
  } else if (toolbarActions.length) {
    borderDisplay = BORDER_DISPLAY.hoverable;
  } else {
    borderDisplay = BORDER_DISPLAY.none;
  }

  const sectionClasses = classNames({
    'SectionDisplay': true,
    'SectionDisplay--permanent': borderDisplay === BORDER_DISPLAY.permanent,
    'SectionDisplay--hoverable': borderDisplay === BORDER_DISPLAY.hoverable,
    'SectionDisplay--allowsInput': !!registeredPlugin?.info.allowsInput,
    'is-dragged': isDragged,
    'is-other-section-dragged': isOtherSectionDragged
  });

  const sectionToolbarClasses = classNames({
    'SectionDisplay-toolbar': true,
    'SectionDisplay-toolbar--hoverable': borderDisplay === BORDER_DISPLAY.hoverable,
    'is-editing': isEditing
  });

  return (
    <section className={sectionClasses} {...getSectionElementDataAttributes(section)} onClick={handleSectionClick}>
      {isEditing ? renderEditorComponent() : renderDisplayComponent()}

      {borderDisplay !== BORDER_DISPLAY.none && (
        <div className={sectionToolbarClasses}>
          <div className="SectionDisplay-toolbarInfo" {...dragHandleProps}>
            {renderSectionType()}
            {!!section.revision && <span className="SectionDisplay-sectionRevisionSeparator">|</span>}
            {renderSectionRevision()}
          </div>
          <div className="SectionDisplay-toolbarButtons">
            {toolbarActions.map(renderToolbarAction)}
          </div>
        </div>
      )}

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
  documentInputId: PropTypes.string,
  sectionInput: sectionInputShape,
  section: sectionShape.isRequired,
  context: sectionContextShape.isRequired,
  canEdit: PropTypes.bool.isRequired,
  canHardDelete: PropTypes.bool.isRequired,
  canModifyInput: PropTypes.bool.isRequired,
  canCopyToClipboard: PropTypes.bool.isRequired,
  dragHandleProps: PropTypes.object.isRequired,
  isDragged: PropTypes.bool.isRequired,
  isEditing: PropTypes.bool.isRequired,
  isOtherSectionDragged: PropTypes.bool.isRequired,
  isPending: PropTypes.bool.isRequired,
  onPendingSectionApply: PropTypes.func.isRequired,
  onPendingSectionDiscard: PropTypes.func.isRequired,
  onSectionContentChange: PropTypes.func.isRequired,
  onSectionInputChange: PropTypes.func.isRequired,
  onSectionCopyToClipboard: PropTypes.func.isRequired,
  onSectionDelete: PropTypes.func.isRequired,
  onSectionDuplicate: PropTypes.func.isRequired,
  onSectionEditEnter: PropTypes.func.isRequired,
  onSectionEditLeave: PropTypes.func.isRequired,
  onSectionHardDelete: PropTypes.func.isRequired,
  onSectionMoveDown: PropTypes.func.isRequired,
  onSectionMoveUp: PropTypes.func.isRequired
};

SectionDisplay.defaultProps = {
  documentInputId: null,
  sectionInput: null
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
  onSectionInputChange,
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
  onSectionInputChange: useStableCallback(onSectionInputChange),
  onSectionCopyToClipboard: useStableCallback(onSectionCopyToClipboard),
  onSectionHardDelete: useStableCallback(onSectionHardDelete),
  ...rest
}));
