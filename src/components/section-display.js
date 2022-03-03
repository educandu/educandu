import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { isMacOs } from '../ui/browser-helper.js';
import DeletedSection from './deleted-section.js';
import { useService } from './container-context.js';
import InfoFactory from '../plugins/info-factory.js';
import EditorFactory from '../plugins/editor-factory.js';
import EditPluginIcon from './icons/edit-plugin-icon.js';
import React, { Fragment, useMemo, useState } from 'react';
import RendererFactory from '../plugins/renderer-factory.js';
import DeletePluginIcon from './icons/delete-plugin-icon.js';
import NotSupportedSection from './not-supported-section.js';
import MoveUpPluginIcon from './icons/move-up-plugin-icon.js';
import MoveDownPluginIcon from './icons/move-down-plugin-icon.js';
import DuplicatePluginIcon from './icons/duplicate-plugin-icon.js';
import { sectionShape, filePickerStorageShape } from '../ui/default-prop-types.js';
import { CheckOutlined, CloseOutlined, DragOutlined, EyeOutlined, ThunderboltOutlined } from '@ant-design/icons';

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
  onSectionHardDelete
}) {
  const { t } = useTranslation();
  const infoFactory = useService(InfoFactory);
  const editorFactory = useService(EditorFactory);
  const rendererFactory = useService(RendererFactory);

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
        <div className="SectionDisplay-actionTooltipTitle">{t(`common:${action}`)}</div>
        {!!shortcutParts.length && (
          <Fragment>
            <div className="SectionDisplay-actionTooltipSubtext">Windows: {composeShortcutText(shortcutParts)}</div>
            <div className="SectionDisplay-actionTooltipSubtext">Mac: {composeShortcutText(macOSShortcutParts)}</div>
          </Fragment>
        )}
      </div>
    );
  };

  const editActions = [
    {
      type: 'edit',
      tooltip: renderActionTooltip('edit', ['ctrl', 'click']),
      icon: <EditPluginIcon key="edit" />,
      handleAction: () => setIsEditing(true),
      isVisible: !isEditing,
      isEnabled: !isEditing && !!section.content
    },
    {
      type: 'preview',
      tooltip: renderActionTooltip('preview', ['ctrl', 'click']),
      icon: <EyeOutlined key="preview" />,
      handleAction: () => setIsEditing(false),
      isVisible: isEditing,
      isEnabled: isEditing
    },
    {
      type: 'duplicate',
      tooltip: renderActionTooltip('duplicate', ['shift', 'ctrl', 'click']),
      icon: <DuplicatePluginIcon key="duplicate" />,
      handleAction: () => onSectionDuplicate(),
      isVisible: true,
      isEnabled: !isEditing
    },
    {
      type: 'delete',
      tooltip: renderActionTooltip('delete', ['shift', 'ctrl', 'alt', 'click']),
      icon: <DeletePluginIcon key="delete" />,
      handleAction: () => onSectionDelete(),
      isVisible: true,
      isEnabled: true
    },
    {
      type: 'moveUp',
      tooltip: renderActionTooltip('moveUp'),
      icon: <MoveUpPluginIcon key="moveUp" />,
      handleAction: () => onSectionMoveUp(),
      isVisible: true,
      isEnabled: true
    },
    {
      type: 'moveDown',
      tooltip: renderActionTooltip('moveDown'),
      icon: <MoveDownPluginIcon key="moveDown" />,
      handleAction: () => onSectionMoveDown(),
      isVisible: true,
      isEnabled: true
    }
  ].filter(action => action.isVisible);

  const getDisplayComponent = useMemo(() => () => {
    return rendererFactory.tryCreateRenderer(section.type)?.getDisplayComponent() || NotSupportedSection;
  }, [rendererFactory, section.type]);

  const getEditorComponent = useMemo(() => () => {
    return editorFactory.tryCreateEditor(section.type)?.getEditorComponent() || NotSupportedSection;
  }, [editorFactory, section.type]);

  const renderDisplayComponent = () => {
    if (section.content) {
      const DisplayComponent = getDisplayComponent();
      return <DisplayComponent content={section.content} />;
    }

    return <DeletedSection section={section} />;
  };

  const renderEditorComponent = () => {
    if (!section.content) {
      throw new Error('Cannot edit a deleted section');
    }

    const EditorComponent = getEditorComponent();
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
        icon={<ThunderboltOutlined />}
        onClick={onSectionHardDelete}
        />
    </Tooltip>
  );

  const renderSectionInfo = () => {
    const sectionInfo = [
      infoFactory.tryCreateInfo(section.type)?.getName(t) || `${t('common:unknown')} (${section.type})`,
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
      } else {
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
  onSectionDelete: () => {},
  onSectionDuplicate: () => {},
  onSectionHardDelete: () => {},
  onSectionMoveDown: () => {},
  onSectionMoveUp: () => {},
  privateStorage: null
};

export default SectionDisplay;
