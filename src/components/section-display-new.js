import { Button } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import React, { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DeletedSection from './deleted-section.js';
import { useService } from './container-context.js';
import InfoFactory from '../plugins/info-factory.js';
import { sectionShape } from '../ui/default-prop-types.js';
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
  canEdit,
  dragHandleProps,
  isDragged,
  isOtherSectionDragged,
  onSectionDuplicate,
  onSectionDelete,
  onSectionMoveUp,
  onSectionMoveDown
}) {
  const { t } = useTranslation();
  const infoFactory = useService(InfoFactory);
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
      label: 'edit',
      icon: <EditOutlined key="edit" />,
      handleAction: () => setIsEditing(true),
      isVisible: !isEditing,
      isEnabled: !isEditing
    },
    {
      label: 'preview',
      icon: <EyeOutlined key="preview" />,
      handleAction: () => setIsEditing(false),
      isVisible: isEditing,
      isEnabled: isEditing
    },
    {
      label: 'duplicate',
      icon: <SnippetsOutlined key="duplicate" />,
      handleAction: () => onSectionDuplicate(),
      isVisible: true,
      isEnabled: !isEditing
    },
    {
      label: 'delete',
      icon: <DeleteOutlined key="delete" />,
      handleAction: () => onSectionDelete(),
      isVisible: true,
      isEnabled: true
    },
    {
      label: 'moveUp',
      icon: <ArrowUpOutlined key="moveUp" />,
      handleAction: () => onSectionMoveUp(),
      isVisible: true,
      isEnabled: true
    },
    {
      label: 'moveDown',
      icon: <ArrowDownOutlined key="moveDown" />,
      handleAction: () => onSectionMoveDown(),
      isVisible: true,
      isEnabled: true
    }
  ].filter(action => action.isVisible);

  const getDisplayComponent = () => {
    const DisplayComponent = rendererFactory.createRenderer(section.type).getDisplayComponent();
    return <DisplayComponent content={section.content} />;
  };

  let displayComponent;
  if (section.content) {
    const isSupportedPlugin = infoFactory.getRegisteredTypes().includes(section.type);
    displayComponent = isSupportedPlugin ? getDisplayComponent() : (<NotSupportedSection />);
  } else {
    displayComponent = (<DeletedSection section={section} />);
  }

  const renderAction = (action, index) => (
    <Button
      key={index}
      className="SectionDisplayNew-actionButton"
      size="small"
      icon={action.icon}
      onClick={action.handleAction}
      disabled={!action.isEnabled}
      />
  );

  return (
    <section className={sectionClasses}>
      {canEdit && (
        <Fragment>
          <div className="SectionDisplayNew-actions SectionDisplayNew-actions--left">
            <div className="SectionDisplayNew-sectionInfo" {...dragHandleProps}>
              <DragOutlined />
              <span>{infoFactory.createInfo(section.type).getName(t)}</span>
            </div>
          </div>
          <div className="SectionDisplayNew-actions SectionDisplayNew-actions--right">
            {actions.map(renderAction)}
          </div>
        </Fragment>
      )}
      {displayComponent}
    </section>
  );
}

SectionDisplayNew.propTypes = {
  canEdit: PropTypes.bool.isRequired,
  dragHandleProps: PropTypes.object,
  isDragged: PropTypes.bool,
  isOtherSectionDragged: PropTypes.bool,
  onSectionDelete: PropTypes.func.isRequired,
  onSectionDuplicate: PropTypes.func.isRequired,
  onSectionMoveDown: PropTypes.func.isRequired,
  onSectionMoveUp: PropTypes.func.isRequired,
  section: sectionShape.isRequired
};

SectionDisplayNew.defaultProps = {
  dragHandleProps: {},
  isDragged: false,
  isOtherSectionDragged: false
};

export default SectionDisplayNew;
