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
  DeleteOutlined,
  DragOutlined,
  EditOutlined,
  EyeOutlined,
  SnippetsOutlined
} from '@ant-design/icons';

function SectionDisplayNew({
  section,
  sectionContainerId,
  canEdit,
  dragHandleProps,
  isDragged,
  isOtherSectionDragged,
  onSectionDuplicate,
  onSectionDelete,
  onSectionMoveUp,
  onSectionMoveDown,
  onSectionContentChange
}) {
  const { t } = useTranslation();
  const infoFactory = useService(InfoFactory);
  const editorFactory = useService(EditorFactory);
  const rendererFactory = useService(RendererFactory);

  const sectionClasses = classNames({
    'SectionDisplayNew': true,
    'is-editable': canEdit,
    'is-dragged': isDragged,
    'is-other-section-dragged': isOtherSectionDragged
  });

  const [isEditing, setIsEditing] = useState(false);

  const actions = [
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

  const renderAction = (action, index) => (
    <Tooltip key={index} title={action.title} placement="topRight">
      <Button
        className={`SectionDisplayNew-actionButton SectionDisplayNew-actionButton--${action.type}`}
        size="small"
        icon={action.icon}
        onClick={action.handleAction}
        disabled={!action.isEnabled}
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

  return (
    <section className={sectionClasses}>
      {canEdit && (
        <Fragment>
          <div className="SectionDisplayNew-actions SectionDisplayNew-actions--left">
            <div className="SectionDisplayNew-sectionInfo" {...dragHandleProps}>
              <DragOutlined />
              {renderSectionInfo()}
            </div>
          </div>
          <div className="SectionDisplayNew-actions SectionDisplayNew-actions--right">
            {actions.map(renderAction)}
          </div>
        </Fragment>
      )}
      {isEditing ? renderEditorComponent() : renderDisplayComponent()}
    </section>
  );
}

SectionDisplayNew.propTypes = {
  canEdit: PropTypes.bool.isRequired,
  dragHandleProps: PropTypes.object,
  isDragged: PropTypes.bool,
  isOtherSectionDragged: PropTypes.bool,
  onSectionContentChange: PropTypes.func.isRequired,
  onSectionDelete: PropTypes.func.isRequired,
  onSectionDuplicate: PropTypes.func.isRequired,
  onSectionMoveDown: PropTypes.func.isRequired,
  onSectionMoveUp: PropTypes.func.isRequired,
  section: sectionShape.isRequired,
  sectionContainerId: PropTypes.string.isRequired
};

SectionDisplayNew.defaultProps = {
  dragHandleProps: {},
  isDragged: false,
  isOtherSectionDragged: false
};

export default SectionDisplayNew;
