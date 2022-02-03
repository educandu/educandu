import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import DeletedSection from './deleted-section.js';
import { useService } from './container-context.js';
import InfoFactory from '../plugins/info-factory.js';
import EditorFactory from '../plugins/editor-factory.js';
import { sectionShape } from '../ui/default-prop-types.js';
import React, { Fragment, useMemo, useState } from 'react';
import RendererFactory from '../plugins/renderer-factory.js';
import NotSupportedSection from './not-supported-section.js';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  DragOutlined,
  EditOutlined,
  EyeOutlined,
  SnippetsOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';

function SectionDisplay({
  section,
  sectionContainerId,
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

  const editActions = [
    {
      type: 'edit',
      title: t('common:edit'),
      icon: <EditOutlined key="edit" />,
      handleAction: () => setIsEditing(true),
      isVisible: !isEditing,
      isEnabled: !isEditing && !!section.content
    },
    {
      type: 'preview',
      title: t('common:preview'),
      icon: <EyeOutlined key="preview" />,
      handleAction: () => setIsEditing(false),
      isVisible: isEditing,
      isEnabled: isEditing
    },
    {
      type: 'duplicate',
      title: t('common:duplicate'),
      icon: <SnippetsOutlined key="duplicate" />,
      handleAction: () => onSectionDuplicate(),
      isVisible: true,
      isEnabled: !isEditing
    },
    {
      type: 'delete',
      title: t('common:delete'),
      icon: <DeleteOutlined key="delete" />,
      handleAction: () => onSectionDelete(),
      isVisible: true,
      isEnabled: true
    },
    {
      type: 'moveUp',
      title: t('common:moveUp'),
      icon: <ArrowUpOutlined key="moveUp" />,
      handleAction: () => onSectionMoveUp(),
      isVisible: true,
      isEnabled: true
    },
    {
      type: 'moveDown',
      title: t('common:moveDown'),
      icon: <ArrowDownOutlined key="moveDown" />,
      handleAction: () => onSectionMoveDown(),
      isVisible: true,
      isEnabled: true
    }
  ].filter(action => action.isVisible);

  const getDisplayComponent = useMemo(() => () => {
    try {
      return rendererFactory.createRenderer(section.type).getDisplayComponent();
    } catch (error) {
      return NotSupportedSection;
    }
  }, [rendererFactory, section.type]);

  const getEditorComponent = useMemo(() => () => {
    try {
      return editorFactory.createEditor(section.type).getEditorComponent();
    } catch (error) {
      return NotSupportedSection;
    }
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
    return <EditorComponent sectionContainerId={sectionContainerId} content={section.content} onContentChanged={onSectionContentChange} />;
  };

  const renderEditAction = (action, index) => (
    <Tooltip key={index} title={action.title} placement="topRight">
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
      infoFactory.createInfo(section.type).getName(t),
      section.revision ? `${t('common:revision')}: ${section.revision}` : null
    ].filter(s => s).join(' | ');

    return (<span>{sectionInfo}</span>);
  };

  const renderSectionRevision = () => (
    <span>{section.revision ? `${t('common:revision')}: ${section.revision}` : null}</span>
  );

  return (
    <section className={sectionClasses}>
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
  section: sectionShape.isRequired,
  sectionContainerId: PropTypes.string.isRequired
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
  onSectionMoveUp: () => {}
};

export default SectionDisplay;
