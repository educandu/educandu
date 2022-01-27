import { Button } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import React, { Fragment } from 'react';
import DeletedSection from './deleted-section.js';
import { useService } from './container-context.js';
import InfoFactory from '../plugins/info-factory.js';
import { sectionShape } from '../ui/default-prop-types.js';
import RendererFactory from '../plugins/renderer-factory.js';
import NotSupportedSection from './not-supported-section.js';
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, DragOutlined, EditOutlined, SnippetsOutlined } from '@ant-design/icons';

function SectionDisplayNew({ section, canEdit, dragHandleProps, onSectionMoveUp, onSectionMoveDown }) {
  const infoFactory = useService(InfoFactory);
  const rendererFactory = useService(RendererFactory);

  const sectionClasses = classNames({
    'SectionDisplayNew': true,
    'is-editable': canEdit
  });

  const actions = [
    {
      label: 'edit',
      icon: <EditOutlined key="edit" />,
      handleAction: () => { }
    },
    {
      label: 'duplicate',
      icon: <SnippetsOutlined key="duplicate" />,
      handleAction: () => { }
    },
    {
      label: 'delete',
      icon: <DeleteOutlined key="delete" />,
      handleAction: () => { }
    },
    {
      label: 'moveUp',
      icon: <ArrowUpOutlined key="moveUp" />,
      handleAction: () => onSectionMoveUp()
    },
    {
      label: 'moveDown',
      icon: <ArrowDownOutlined key="moveDown" />,
      handleAction: () => onSectionMoveDown()
    }
  ];

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
      />
  );

  return (
    <section className={sectionClasses}>
      {canEdit && (
        <Fragment>
          <div className="SectionDisplayNew-actions SectionDisplayNew-actions--left">
            <Button size="small" icon={<DragOutlined />} {...dragHandleProps} />
            <span>{section.type}</span>
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
  onSectionMoveDown: PropTypes.func.isRequired,
  onSectionMoveUp: PropTypes.func.isRequired,
  section: sectionShape.isRequired
};

SectionDisplayNew.defaultProps = {
  dragHandleProps: {}
};

export default SectionDisplayNew;
